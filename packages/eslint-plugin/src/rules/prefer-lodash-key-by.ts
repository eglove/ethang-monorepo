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

type MessageIds = "preferLodashKeyBy";

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
  if (!isIdentifier(call.callee.property)) {
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

const getKeyByAssignment = (
  expressionStatement: TSESTree.ExpressionStatement,
  accumulatorName: string,
  itemName: string
) => {
  const { expression } = expressionStatement;
  if (AST_NODE_TYPES.AssignmentExpression !== expression.type) {
    return null;
  }
  if ("=" !== expression.operator) {
    return null;
  }
  const assign = expression;

  if (!isMemberAccumulator(assign.left, accumulatorName)) {
    return null;
  }
  if (!isMemberExpression(assign.left)) {
    return null;
  }
  const member = assign.left;

  if (!isIdentifier(assign.right)) {
    return null;
  }
  if (itemName !== assign.right.name) {
    return null;
  }

  return extractKeyFromMember(member, itemName);
};

const validateReduceCallStructure = (call: TSESTree.CallExpression) => {
  if (!isReduceCall(call)) {
    return null;
  }
  if (2 > call.arguments.length) {
    return null;
  }
  const [, defaultArgument] = call.arguments;
  if (!defaultArgument || !isEmptyObject(defaultArgument)) {
    return null;
  }
  if (!isMemberExpression(call.callee)) {
    return null;
  }
  return { arr: call.callee.object };
};

const validateCallbackStructure = (callback: TSESTree.Node) => {
  if (!isReduceCallback(callback)) {
    return null;
  }
  if (!hasTwoIdentifierParameters(callback)) {
    return null;
  }
  const [first, second] = callback.params;
  if (!first || !second || !isIdentifier(first) || !isIdentifier(second)) {
    return null;
  }
  const { name: accumulatorName } = first;
  const { name: itemName } = second;
  if (AST_NODE_TYPES.BlockStatement !== callback.body.type) {
    return null;
  }
  return { accumulatorName, block: callback.body, itemName };
};

const validateBlockStructure = (
  block: TSESTree.BlockStatement,
  accumulatorName: string
) => {
  if (2 > block.body.length) {
    return null;
  }
  if (!returnsAccumulator(block, accumulatorName)) {
    return null;
  }
  const [firstStatement] = block.body;
  if (firstStatement?.type !== AST_NODE_TYPES.ExpressionStatement) {
    return null;
  }
  return firstStatement;
};

export const detectKeyByPattern = (node: TSESTree.Node) => {
  if (!isCallExpression(node)) {
    return null;
  }

  const arrayInfo = validateReduceCallStructure(node);
  if (isNil(arrayInfo)) {
    return null;
  }

  const [firstArgument] = node.arguments;
  if (!firstArgument) {
    return null;
  }

  const callbackInfo = validateCallbackStructure(firstArgument);
  if (isNil(callbackInfo)) {
    return null;
  }

  const firstStatement = validateBlockStructure(
    callbackInfo.block,
    callbackInfo.accumulatorName
  );
  if (isNil(firstStatement)) {
    return null;
  }

  const key = getKeyByAssignment(
    firstStatement,
    callbackInfo.accumulatorName,
    callbackInfo.itemName
  );
  if (isNil(key)) {
    return null;
  }

  return { arr: arrayInfo.arr, key };
};

export const preferLodashKeyByRule = createRule<Options, MessageIds>({
  create: (context) => {
    return {
      CallExpression: (node: TSESTree.CallExpression) => {
        const result = detectKeyByPattern(node);
        if (isNil(result)) {
          return;
        }
        context.report({
          messageId: "preferLodashKeyBy",
          node
        });
      }
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Prefer `_.keyBy(arr, 'key')` over reduce-based keyBy patterns."
    },
    messages: {
      preferLodashKeyBy:
        "Prefer `_.keyBy(arr, 'key')` over reduce-based keyBy patterns. Lodash provides a cleaner, more readable alternative."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-lodash-key-by"
});
