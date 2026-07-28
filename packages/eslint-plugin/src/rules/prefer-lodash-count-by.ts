import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";

import {
  extractKeyFromMember,
  isMemberAccumulator,
  validateBlockStructure,
  validateCallbackStructure,
  validateReduceCallStructure
} from "./../utils/reduce-patterns.ts";
import { isCallExpression } from "./../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferLodashCountBy";

type Options = [];

const isPlusOne = (node: TSESTree.Node): node is TSESTree.BinaryExpression => {
  if (AST_NODE_TYPES.BinaryExpression !== node.type) {
    return false;
  }

  if ("+" !== node.operator) {
    return false;
  }

  if (AST_NODE_TYPES.Literal !== node.right.type) {
    return false;
  }

  if (1 !== node.right.value) {
    return false;
  }
  return true;
};

const isOrZero = (node: TSESTree.Node): node is TSESTree.LogicalExpression => {
  if (AST_NODE_TYPES.LogicalExpression !== node.type) {
    return false;
  }

  if ("||" !== node.operator) {
    return false;
  }

  if (AST_NODE_TYPES.Literal !== node.right.type) {
    return false;
  }

  if (0 !== node.right.value) {
    return false;
  }
  return true;
};

function extractCountByKey(
  expressionStatement: TSESTree.ExpressionStatement,
  accumulatorName: string,
  itemName: string
) {
  const { expression } = expressionStatement;

  if (AST_NODE_TYPES.AssignmentExpression !== expression.type) {
    return null;
  }

  if ("=" !== expression.operator) {
    return null;
  }

  if (!isMemberAccumulator(expression.left, accumulatorName)) {
    return null;
  }
  const member = expression.left;
  const key = extractKeyFromMember(member, itemName);
  if (isNil(key)) {
    return null;
  }
  const rightNode = expression.right;

  if (!isPlusOne(rightNode)) {
    return null;
  }

  if (!isOrZero(rightNode.left)) {
    return null;
  }
  const logical = rightNode.left;

  if (!isMemberAccumulator(logical.left, accumulatorName)) {
    return null;
  }
  const logKey = extractKeyFromMember(logical.left, itemName);

  if (logKey !== key || isNil(logKey)) {
    return null;
  }
  return key;
}

export const detectCountByPattern = (node: TSESTree.Node) => {
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
