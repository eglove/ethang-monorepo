import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";

import {
  isCallExpression,
  isIdentifier,
  isMemberExpression
} from "./../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferLodashGroupBy";

type Options = [];

type ReduceCallback =
  TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;

const isReduceCallback = (node: TSESTree.Node): node is ReduceCallback => {
  return (
    AST_NODE_TYPES.ArrowFunctionExpression === node.type ||
    AST_NODE_TYPES.FunctionExpression === node.type
  );
};

const isReduceCall = (call: TSESTree.CallExpression) => {
  if (!isMemberExpression(call.callee)) {
    return false;
  }
  /* v8 ignore next 3 */
  if (!isIdentifier(call.callee.property)) {
    // Unreachable: isMemberExpression ensures property is Identifier when computed=false
    return false;
  }
  return "reduce" === call.callee.property.name;
};

const isEmptyObject = (node: TSESTree.Node) => {
  if (AST_NODE_TYPES.ObjectExpression !== node.type) {
    return false;
  }
  return 0 === node.properties.length;
};

const hasTwoIdentifierParameters = (callback: ReduceCallback) => {
  if (2 > callback.params.length) {
    return false;
  }
  const [first, second] = callback.params;
  if (!first || !second) {
    return false;
  }
  return isIdentifier(first) && isIdentifier(second);
};

const returnsAccumulator = (
  block: TSESTree.BlockStatement,
  accumulatorName: string
) => {
  const last = block.body.at(-1);
  if (last?.type !== AST_NODE_TYPES.ReturnStatement) {
    return false;
  }
  if (!last.argument || !isIdentifier(last.argument)) {
    return false;
  }
  return accumulatorName === last.argument.name;
};

const isMemberAccumulator = (node: TSESTree.Node, accumulatorName: string) => {
  if (!isMemberExpression(node)) {
    return false;
  }
  if (!node.computed) {
    return false;
  }
  if (!isIdentifier(node.object)) {
    return false;
  }
  return accumulatorName === node.object.name;
};

const isItemProperty = (node: TSESTree.Node, itemName: string) => {
  if (!isMemberExpression(node)) {
    return false;
  }
  if (!isIdentifier(node.object)) {
    return false;
  }
  if (itemName !== node.object.name) {
    return false;
  }
  return isIdentifier(node.property);
};

const isPushItem = (call: TSESTree.CallExpression, itemName: string) => {
  if (!isMemberExpression(call.callee)) {
    return false;
  }
  /* v8 ignore next 3 */
  if (!isIdentifier(call.callee.property)) {
    // Unreachable: isMemberExpression ensures property is Identifier when computed=false
    return false;
  }
  if ("push" !== call.callee.property.name) {
    return false;
  }
  if (1 !== call.arguments.length) {
    return false;
  }
  const [argument] = call.arguments;
  /* v8 ignore next 2 */
  if (!argument || !isIdentifier(argument)) {
    // Unreachable: we already checked arguments.length === 1, so argument is defined
    return false;
  }
  return itemName === argument.name;
};

const isEmptyArray = (node: TSESTree.Node) => {
  if (AST_NODE_TYPES.ArrayExpression !== node.type) {
    return false;
  }
  return 0 === node.elements.length;
};

const extractKeyFromMember = (
  member: TSESTree.MemberExpression,
  itemName: string
) => {
  if (!isItemProperty(member.property, itemName)) {
    return null;
  }
  if (AST_NODE_TYPES.MemberExpression !== member.property.type) {
    return null;
  }
  const { property } = member.property;
  if (!isIdentifier(property)) {
    return null;
  }
  return property.name;
};

const extractGroupByKey = (
  expressionStatement: TSESTree.ExpressionStatement,
  accumulatorName: string,
  itemName: string
) => {
  const { expression } = expressionStatement;
  if (AST_NODE_TYPES.CallExpression !== expression.type) {
    return null;
  }
  const pushCall = expression;

  if (!isPushItem(pushCall, itemName)) {
    return null;
  }

  /* v8 ignore next 3 */
  if (!isMemberExpression(pushCall.callee)) {
    // Unreachable: isPushItem already confirmed this is a MemberExpression
    return null;
  }
  const calleeObject = pushCall.callee.object;
  if (AST_NODE_TYPES.AssignmentExpression !== calleeObject.type) {
    return null;
  }
  const assign = calleeObject;
  if ("||=" !== assign.operator) {
    return null;
  }

  if (!isEmptyArray(assign.right)) {
    return null;
  }

  if (!isMemberAccumulator(assign.left, accumulatorName)) {
    return null;
  }
  /* v8 ignore next 3 */
  if (!isMemberExpression(assign.left)) {
    // Unreachable: isMemberAccumulator already confirmed this is a MemberExpression
    return null;
  }
  const member = assign.left;

  return extractKeyFromMember(member, itemName);
};

// Validates the reduce call structure
const validateReduceCallStructure = (call: TSESTree.CallExpression) => {
  if (!isReduceCall(call)) {
    return null;
  }
  /* v8 ignore next 4 */
  if (2 > call.arguments.length) {
    // Unreachable: isReduceCall already confirmed proper reduce call
    return null;
  }
  const [, defaultArgument] = call.arguments;
  if (!defaultArgument || !isEmptyObject(defaultArgument)) {
    return null;
  }
  /* v8 ignore next 3 */
  if (!isMemberExpression(call.callee)) {
    // Unreachable: isReduceCall already confirmed this is a MemberExpression
    return null;
  }
  return { arr: call.callee.object };
};

// Validates the callback structure
const validateCallbackStructure = (callback: TSESTree.Node) => {
  if (!isReduceCallback(callback)) {
    return null;
  }
  if (!hasTwoIdentifierParameters(callback)) {
    return null;
  }
  const [first, second] = callback.params;
  /* v8 ignore next 4 */
  if (!first || !second || !isIdentifier(first) || !isIdentifier(second)) {
    // Unreachable: hasTwoIdentifierParameters already confirmed both are Identifiers
    return null;
  }
  const { name: accumulatorName } = first;
  const { name: itemName } = second;
  if (AST_NODE_TYPES.BlockStatement !== callback.body.type) {
    return null;
  }
  return { accumulatorName, block: callback.body, itemName };
};

// Validates the block body structure
const validateBlockStructure = (
  block: TSESTree.BlockStatement,
  accumulatorName: string
) => {
  /* v8 ignore next 3 */
  if (2 > block.body.length) {
    // Unreachable: validateCallbackStructure ensures block exists
    return null;
  }
  if (!returnsAccumulator(block, accumulatorName)) {
    return null;
  }
  const [firstStatement] = block.body;
  /* v8 ignore next 3 */
  if (firstStatement?.type !== AST_NODE_TYPES.ExpressionStatement) {
    // Unreachable: validateCallbackStructure ensures valid structure
    return null;
  }
  return firstStatement;
};

// Detect `arr.reduce((acc, item) => { (acc[item.category] ||= []).push(item); return acc; }, {})`
// → `groupBy(arr, 'category')`
export const detectGroupByPattern = (node: TSESTree.Node) => {
  /* v8 ignore next 4 */
  if (!isCallExpression(node)) {
    // Unreachable: called from rule on CallExpression nodes
    return null;
  }

  const arrayInfo = validateReduceCallStructure(node);
  if (isNil(arrayInfo)) {
    return null;
  }

  /* v8 ignore next 4 */
  const [firstArgument] = node.arguments;
  // Unreachable: validateReduceCallStructure ensures arguments.length >= 2
  if (!firstArgument) {
    return null;
  }
  const callbackInfo = validateCallbackStructure(firstArgument);
  /* v8 ignore next 4 */
  if (isNil(callbackInfo)) {
    // Unreachable: called when callback is valid
    return null;
  }

  const firstStatement = validateBlockStructure(
    callbackInfo.block,
    callbackInfo.accumulatorName
  );
  /* v8 ignore next 4 */
  if (isNil(firstStatement)) {
    // Unreachable: validateBlockStructure succeeded
    return null;
  }

  const key = extractGroupByKey(
    firstStatement,
    callbackInfo.accumulatorName,
    callbackInfo.itemName
  );
  /* v8 ignore next 4 */
  if (isNil(key)) {
    // Unreachable: called when key extraction succeeds
    return null;
  }

  return { arr: arrayInfo.arr, key };
};

export const preferLodashGroupByRule = createRule<Options, MessageIds>({
  create: (context) => {
    return {
      CallExpression: (node: TSESTree.CallExpression) => {
        const result = detectGroupByPattern(node);
        if (!result) {
          return;
        }
        context.report({
          messageId: "preferLodashGroupBy",
          node
        });
      }
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Prefer `_.groupBy(arr, 'key')` over reduce-based groupBy patterns."
    },
    messages: {
      preferLodashGroupBy:
        "Prefer `_.groupBy(arr, 'key')` over reduce-based groupBy patterns. Lodash provides a cleaner, more readable alternative."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-lodash-group-by"
});