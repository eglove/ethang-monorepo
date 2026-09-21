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
import { isCallExpression, isIdentifier } from "./../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferLodashKeyBy";

type Options = [];

function getKeyByAssignment(
  expressionStatement: TSESTree.ExpressionStatement,
  accumulatorName: string,
  itemName: string
) {
  const { expression } = expressionStatement;

  if (
    AST_NODE_TYPES.AssignmentExpression !== expression.type ||
    "=" !== expression.operator
  ) {
    return null;
  }
  const assign = expression;

  if (!isMemberAccumulator(assign.left, accumulatorName)) {
    return null;
  }
  const member = assign.left;

  return !isIdentifier(assign.right) || itemName !== assign.right.name
    ? null
    : extractKeyFromMember(member, itemName);
}

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
  return isNil(key) ? null : { arr: arrayInfo.arr, key };
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
