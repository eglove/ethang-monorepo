import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";

import { isIdentifier, isMemberExpression } from "./../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferEffectArrayScan";

type Options = [];

// Check if a node is an array literal with exactly one element.
// Returns the single element expression, or null if not a single-element array.
export const getSingleElementArray = (node: TSESTree.Node) => {
  if (AST_NODE_TYPES.ArrayExpression !== node.type) {
    return null;
  }
  const arrayNode = node;
  if (1 !== arrayNode.elements.length) {
    return null;
  }
  const [element] = arrayNode.elements;
  if (isNil(element)) {
    return null;
  }
  if (AST_NODE_TYPES.SpreadElement === element.type) {
    return null;
  }
  return element;
};

// Extract the array expression from a callback body (arrow implicit return
// or block with single return statement). Returns null when the body shape
// does not match.
const extractArrayFromCallbackBody = (callbackBody: TSESTree.Node) => {
  if (AST_NODE_TYPES.ArrayExpression === callbackBody.type) {
    return callbackBody;
  }
  if (AST_NODE_TYPES.BlockStatement !== callbackBody.type) {
    return null;
  }
  return extractArrayFromBlockBody(callbackBody);
};

// Extract the array expression from a block statement body.
const extractArrayFromBlockBody = (block: TSESTree.BlockStatement) => {
  if (1 !== block.body.length) {
    return null;
  }
  const [statement] = block.body;
  // unreachable: length === 1 guarantees index 0 exists

  if (isNil(statement)) {
    return null;
  }
  if (AST_NODE_TYPES.ReturnStatement !== statement.type) {
    return null;
  }
  const returnStatement = statement;
  if (isNil(returnStatement.argument)) {
    return null;
  }
  if (AST_NODE_TYPES.ArrayExpression !== returnStatement.argument.type) {
    return null;
  }
  return returnStatement.argument;
};

// Check if an array expression matches the `[...acc, <body>]` shape where
// `acc` matches the given parameter name. Returns the body expression or null.
const validateScanArrayShape = (
  arrayExpression: TSESTree.ArrayExpression,
  accumulatorName: string
) => {
  if (2 !== arrayExpression.elements.length) {
    return null;
  }
  const [first, second] = arrayExpression.elements;
  if (isNil(first)) {
    return null;
  }
  if (AST_NODE_TYPES.SpreadElement !== first.type) {
    return null;
  }
  const spread = first;
  if (!isIdentifier(spread.argument)) {
    return null;
  }
  if (accumulatorName !== spread.argument.name) {
    return null;
  }
  if (isNil(second)) {
    return null;
  }
  if (AST_NODE_TYPES.SpreadElement === second.type) {
    return null;
  }
  return second;
};

// Check if a return statement or arrow function body returns an array
// literal of the form `[...acc, <body>]` where `acc` matches the callback
// parameter name. Returns the body expression or null.
export const getScanBody = (
  callbackBody: TSESTree.Node,
  accumulatorName: string
) => {
  const arrayExpression = extractArrayFromCallbackBody(callbackBody);
  if (isNil(arrayExpression)) {
    return null;
  }
  return validateScanArrayShape(arrayExpression, accumulatorName);
};

// Validate the reduce call target: must be a member expression accessing
// `.reduce` on a non-computed property. Returns the member expression or null.
const validateReduceTarget = (call: TSESTree.CallExpression) => {
  if (!isMemberExpression(call.callee)) {
    return null;
  }
  const member = call.callee;
  if (!isIdentifier(member.property)) {
    return null;
  }
  if ("reduce" !== member.property.name) {
    return null;
  }
  return member;
};

// Validate the callback argument: must be an arrow or function expression with at least 2 parameters where the first is an identifier.
// Validate the callback argument: must be an arrow or function expression with at least 2 parameters where the first is an identifier.
// Returns the callback and acc parameter name, or null.
const validateCallback = (
  callbackArgument: TSESTree.CallExpressionArgument
) => {
  if (
    AST_NODE_TYPES.ArrowFunctionExpression !== callbackArgument.type &&
    AST_NODE_TYPES.FunctionExpression !== callbackArgument.type
  ) {
    return null;
  }
  const callback = callbackArgument;
  if (2 > callback.params.length) {
    return null;
  }
  const [accumulatorParameter] = callback.params;
  // unreachable: length >= 2 guarantees index 0 exists

  if (isNil(accumulatorParameter)) {
    return null;
  }
  if (!isIdentifier(accumulatorParameter)) {
    return null;
  }
  return { accName: accumulatorParameter.name, callback };
};

// Detect the `.reduce((acc, x) => [...acc, <body>], [<init>])` pattern.
// This is a scan: it builds an array of all intermediate accumulator values.
// Effect's `Array.scan` expresses this more directly.
export const detectArrayScanPattern = (node: TSESTree.Node) => {
  // unreachable: the rule listener only visits CallExpression nodes, so this
  // guard is defensive only

  if (AST_NODE_TYPES.CallExpression !== node.type) {
    return null;
  }

  const call = node;
  const member = validateReduceTarget(call);
  if (isNil(member)) {
    return null;
  }

  // Must have exactly 2 arguments: callback and initial value
  if (2 !== call.arguments.length) {
    return null;
  }

  const [callbackArgument, initialValueArgument] = call.arguments;
  // unreachable: length === 2 guarantees indices 0 and 1 exist

  if (isNil(callbackArgument) || isNil(initialValueArgument)) {
    return null;
  }

  // Initial value must be a single-element array: [init]
  const initValue = getSingleElementArray(initialValueArgument);
  if (isNil(initValue)) {
    return null;
  }

  // Validate callback shape
  const callbackResult = validateCallback(callbackArgument);
  if (isNil(callbackResult)) {
    return null;
  }

  const { accName, callback } = callbackResult;

  // Check if the callback body returns [...acc, <body>]
  const bodyExpression = getScanBody(callback.body, accName);
  if (isNil(bodyExpression)) {
    return null;
  }

  return {
    accName,
    bodyExpr: bodyExpression,
    elementParam: callback.params[1],
    initValue,
    receiver: member.object
  };
};

export const preferEffectArrayScanRule = createRule<Options, MessageIds>({
  create(context) {
    const listener: TSESLint.RuleListener = {
      CallExpression: (node) => {
        const match = detectArrayScanPattern(node);
        if (isNil(match)) {
          return;
        }

        context.report({
          messageId: "preferEffectArrayScan",
          node
        });
      }
    };

    return listener;
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Prefer `Array.scan` over `reduce` patterns that accumulate intermediate states into an array."
    },
    messages: {
      preferEffectArrayScan:
        "Prefer `Array.scan(init, fn)(arr)` over `arr.reduce((acc, x) => [...acc, fn(acc, x)], [init])`. Effect `Array.scan` directly expresses running accumulator semantics."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-effect-array-scan"
});
