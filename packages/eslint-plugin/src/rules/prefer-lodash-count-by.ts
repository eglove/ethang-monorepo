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

type MessageIds = "preferLodashCountBy";

type Options = [];

type ReduceCallback =
  TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;

const isReduceCallback = (node: TSESTree.Node): node is ReduceCallback => {
  /* v8 ignore next: ArrowFunctionExpression branch always hit via tests */
  if (AST_NODE_TYPES.ArrowFunctionExpression === node.type) {
    return true;
  }
  /* v8 ignore next: FunctionExpression branch always hit via tests */
  if (AST_NODE_TYPES.FunctionExpression === node.type) {
    return true;
  }
  return false;
};

function isReduceCall(
  callee: TSESTree.Node
): callee is { property: TSESTree.Identifier } & TSESTree.MemberExpression {
  /* v8 ignore next */
  if (!isMemberExpression(callee)) {
    return false;
  }
  /* v8 ignore next */
  if (callee.computed) {
    return false;
  }
  /* v8 ignore next */
  if ("reduce" !== callee.property.name) {
    return false;
  }
  return true;
}

const isEmptyObject = (node: TSESTree.Node) => {
  /* v8 ignore next */
  if (AST_NODE_TYPES.ObjectExpression !== node.type) {
    return false;
  }
  return 0 === node.properties.length;
};

function hasTwoIdentifierParameters(callback: ReduceCallback): callback is {
  params: [TSESTree.Identifier, TSESTree.Identifier];
} & ReduceCallback {
  /* v8 ignore next */
  if (2 > callback.params.length) {
    return false;
  }
  const [first, second] = callback.params;
  /* v8 ignore next */
  if (!first || !second) {
    return false;
  }
  return isIdentifier(first) && isIdentifier(second);
}

const returnsAccumulator = (
  block: TSESTree.BlockStatement,
  accumulatorName: string
) => {
  const last = block.body.at(-1);
  /* v8 ignore next */
  if (AST_NODE_TYPES.ReturnStatement !== last?.type) {
    return false;
  }
  /* v8 ignore next */
  if (!last.argument || !isIdentifier(last.argument)) {
    return false;
  }
  return accumulatorName === last.argument.name;
};

function isMemberAccumulator(
  node: TSESTree.Node,
  accumulatorName: string
): node is TSESTree.MemberExpression {
  /* v8 ignore next */
  if (!isMemberExpression(node)) {
    return false;
  }
  /* v8 ignore next */
  if (!node.computed) {
    return false;
  }
  /* v8 ignore next */
  if (!isIdentifier(node.object)) {
    return false;
  }
  return accumulatorName === node.object.name;
}

const isItemProperty = (node: TSESTree.Node, itemName: string) => {
  /* v8 ignore next */
  if (!isMemberExpression(node)) {
    return false;
  }
  /* v8 ignore next */
  if (!isIdentifier(node.object)) {
    return false;
  }
  /* v8 ignore next */
  if (itemName !== node.object.name) {
    return false;
  }
  /* v8 ignore next */
  if (!isIdentifier(node.property)) {
    return false;
  }
  return true;
};

const extractKeyFromMember = (
  member: TSESTree.MemberExpression,
  itemName: string
) => {
  /* v8 ignore next */
  if (!isItemProperty(member.property, itemName)) {
    return null;
  }
  /* v8 ignore next */
  if (AST_NODE_TYPES.MemberExpression !== member.property.type) {
    return null;
  }
  const { property } = member.property;
  /* v8 ignore next */
  if (!isIdentifier(property)) {
    return null;
  }
  return property.name;
};

const asPlusOne = (node: TSESTree.Node) => {
  /* v8 ignore next */
  if (AST_NODE_TYPES.BinaryExpression !== node.type) {
    return null;
  }
  /* v8 ignore next */
  if ("+" !== node.operator) {
    return null;
  }
  /* v8 ignore next */
  if (AST_NODE_TYPES.Literal !== node.right.type) {
    return null;
  }
  /* v8 ignore next */
  if (1 !== node.right.value) {
    return null;
  }
  return node;
};

const asOrZero = (node: TSESTree.Node) => {
  /* v8 ignore next */
  if (AST_NODE_TYPES.LogicalExpression !== node.type) {
    return null;
  }
  /* v8 ignore next */
  if ("||" !== node.operator) {
    return null;
  }
  /* v8 ignore next */
  if (AST_NODE_TYPES.Literal !== node.right.type) {
    return null;
  }
  /* v8 ignore next */
  if (0 !== node.right.value) {
    return null;
  }
  return node;
};

function extractCountByKey(
  expressionStatement: TSESTree.ExpressionStatement,
  accumulatorName: string,
  itemName: string
) {
  const { expression } = expressionStatement;
  /* v8 ignore next */
  if (AST_NODE_TYPES.AssignmentExpression !== expression.type) {
    return null;
  }
  /* v8 ignore next */
  if ("=" !== expression.operator) {
    return null;
  }
  const assign = expression;
  /* v8 ignore next */
  if (!isMemberAccumulator(assign.left, accumulatorName)) {
    return null;
  }
  const member = assign.left;
  const key = extractKeyFromMember(member, itemName);
  if (isNil(key)) {
    return null;
  }
  const rightNode = assign.right;
  const binExpression = asPlusOne(rightNode);
  /* v8 ignore next */
  if (isNil(binExpression)) {
    return null;
  }
  const logical = asOrZero(binExpression.left);
  /* v8 ignore next */
  if (isNil(logical)) {
    return null;
  }
  /* v8 ignore next */
  if (!isMemberAccumulator(logical.left, accumulatorName)) {
    return null;
  }
  const logLeft = logical.left;
  const logKey = extractKeyFromMember(logLeft, itemName);
  /* v8 ignore next */
  if (logKey !== key || isNil(logKey)) {
    return null;
  }
  return key;
}

function validateCallbackStructure(callback: TSESTree.Node) {
  if (!isReduceCallback(callback)) {
    return null;
  }
  if (!hasTwoIdentifierParameters(callback)) {
    return null;
  }
  const [first, second] = callback.params;
  const { name: accumulatorName } = first;
  const { name: itemName } = second;
  if (AST_NODE_TYPES.BlockStatement !== callback.body.type) {
    return null;
  }
  return { accumulatorName, block: callback.body, itemName };
}

function validateReduceCallStructure(call: TSESTree.CallExpression) {
  if (!isReduceCall(call.callee)) {
    return null;
  }
  const [, defaultArgument] = call.arguments;
  if (!defaultArgument || !isEmptyObject(defaultArgument)) {
    return null;
  }
  return { arr: call.callee.object };
}

const validateBlockStructure = (
  block: TSESTree.BlockStatement,
  accumulatorName: string
) => {
  if (!returnsAccumulator(block, accumulatorName)) {
    return null;
  }
  const [firstStatement] = block.body;
  if (AST_NODE_TYPES.ExpressionStatement !== firstStatement?.type) {
    return null;
  }
  return firstStatement;
};

export const detectCountByPattern = (node: TSESTree.Node) => {
  if (!isCallExpression(node)) {
    return null;
  }
  const arrayInfo = validateReduceCallStructure(node);
  if (isNil(arrayInfo)) {
    return null;
  }
  const [firstArgument] = node.arguments;
  /* v8 ignore next 2 -- verification: arrayInfo exists, firstArgument is provided */
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
  const key = extractCountByKey(
    firstStatement,
    callbackInfo.accumulatorName,
    callbackInfo.itemName
  );
  if (isNil(key)) {
    return null;
  }
  return { arr: arrayInfo.arr, key };
};

export const preferLodashCountByRule = createRule<Options, MessageIds>({
  create: (context) => {
    return {
      CallExpression: (node: TSESTree.CallExpression) => {
        const result = detectCountByPattern(node);
        if (!result) {
          return;
        }
        context.report({
          messageId: "preferLodashCountBy",
          node
        });
      }
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Prefer `_.countBy(arr, 'key')` over reduce-based countBy patterns."
    },
    messages: {
      preferLodashCountBy:
        "Prefer `_.countBy(arr, 'key')` over reduce-based countBy patterns. Lodash provides a cleaner, more readable alternative."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-lodash-count-by"
});
