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

const isEmptyArray = (node: TSESTree.Node) => {

  if (AST_NODE_TYPES.ArrayExpression !== node.type) {
    return false;
  }
  return 0 === node.elements.length;
};

function extractGroupByKey(
  expressionStatement: TSESTree.ExpressionStatement,
  accumulatorName: string,
  itemName: string
) {
  const { expression } = expressionStatement;

  if (AST_NODE_TYPES.CallExpression !== expression.type) {
    return null;
  }

  const callee = getPushCallee(expression);

  if (!callee) {
    return null;
  }

  const argument = expression.arguments[0];

  if (!argument || !isIdentifier(argument) || argument.name !== itemName) {
    return null;
  }

  return getAssignmentKey(callee.object, itemName, accumulatorName);
}

function getAssignmentKey(
  object: TSESTree.Expression,
  itemName: string,
  accumulatorName: string
) {

  if (AST_NODE_TYPES.AssignmentExpression !== object.type) {
    return null;
  }

  if ("||=" !== object.operator) {
    return null;
  }

  if (!isEmptyArray(object.right)) {
    return null;
  }

  if (!isMemberAccumulator(object.left, accumulatorName)) {
    return null;
  }
  return extractKeyFromMember(object.left, itemName);
}

function getPushCallee(call: TSESTree.CallExpression) {
  const { callee } = call;

  if (!isMemberExpression(callee) || callee.computed) {
    return null;
  }

  if ("push" !== callee.property.name || 1 !== call.arguments.length) {
    return null;
  }
  const [argument] = call.arguments;

  if (!argument || !isIdentifier(argument)) {
    return null;
  }
  return callee;
}

export const detectGroupByPattern = (node: TSESTree.Node) => {
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

  const key = extractGroupByKey(
    firstStatement,
    callbackInfo.accumulatorName,
    callbackInfo.itemName
  );
  if (isNil(key)) {
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
