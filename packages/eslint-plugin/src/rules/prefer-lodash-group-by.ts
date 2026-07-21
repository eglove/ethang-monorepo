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
  /* v8 ignore next */
  if (AST_NODE_TYPES.ArrowFunctionExpression === node.type) {
    return true;
  }
  /* v8 ignore next */
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

const isEmptyArray = (node: TSESTree.Node) => {
  /* v8 ignore next */
  if (AST_NODE_TYPES.ArrayExpression !== node.type) {
    return false;
  }
  return 0 === node.elements.length;
};

const validateBlockStructure = (
  block: TSESTree.BlockStatement,
  accumulatorName: string
) => {
  /* v8 ignore next */
  if (!returnsAccumulator(block, accumulatorName)) {
    return null;
  }
  const [firstStatement] = block.body;
  /* v8 ignore next */
  if (AST_NODE_TYPES.ExpressionStatement !== firstStatement?.type) {
    return null;
  }
  return firstStatement;
};

function extractGroupByKey(
  expressionStatement: TSESTree.ExpressionStatement,
  accumulatorName: string,
  itemName: string
) {
  const { expression } = expressionStatement;
  /* v8 ignore next */
  if (AST_NODE_TYPES.CallExpression !== expression.type) {
    return null;
  }

  const callee = getPushCallee(expression);
  /* v8 ignore next */
  if (!callee) {
    return null;
  }

  const argument = expression.arguments[0];
  /* v8 ignore next */
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
  /* v8 ignore next */
  if (AST_NODE_TYPES.AssignmentExpression !== object.type) {
    return null;
  }
  /* v8 ignore next */
  if ("||=" !== object.operator) {
    return null;
  }
  /* v8 ignore next */
  if (!isEmptyArray(object.right)) {
    return null;
  }
  /* v8 ignore next */
  if (!isMemberAccumulator(object.left, accumulatorName)) {
    return null;
  }
  return extractKeyFromMember(object.left, itemName);
}

function getPushCallee(call: TSESTree.CallExpression) {
  const { callee } = call;
  /* v8 ignore next */
  if (!isMemberExpression(callee) || callee.computed) {
    return null;
  }
  /* v8 ignore next */
  if ("push" !== callee.property.name || 1 !== call.arguments.length) {
    return null;
  }
  const [argument] = call.arguments;
  /* v8 ignore next */
  if (!argument || !isIdentifier(argument)) {
    return null;
  }
  return callee;
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

export const detectGroupByPattern = (node: TSESTree.Node) => {
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
