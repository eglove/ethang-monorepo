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

function isReduceCall(
  callee: TSESTree.Node
): callee is { property: TSESTree.Identifier } & TSESTree.MemberExpression {
  return (
    isMemberExpression(callee) &&
    !callee.computed &&
    "reduce" === callee.property.name
  );
}

const isEmptyObject = (node: TSESTree.Node) => {
  if (AST_NODE_TYPES.ObjectExpression !== node.type) {
    return false;
  }
  return 0 === node.properties.length;
};

function hasTwoIdentifierParameters(callback: ReduceCallback): callback is {
  params: [TSESTree.Identifier, TSESTree.Identifier];
} & ReduceCallback {
  if (2 > callback.params.length) {
    return false;
  }
  const [first, second] = callback.params;
  /* v8 ignore next 2 -- verification: callback.params.length >= 2 guarantees first, second exist */
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
  if (AST_NODE_TYPES.ReturnStatement !== last?.type) {
    return false;
  }
  if (!last.argument || !isIdentifier(last.argument)) {
    return false;
  }
  return accumulatorName === last.argument.name;
};

function isMemberAccumulator(
  node: TSESTree.Node,
  accumulatorName: string
): node is TSESTree.MemberExpression {
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
}

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

const isEmptyArray = (node: TSESTree.Node) => {
  if (AST_NODE_TYPES.ArrayExpression !== node.type) {
    return false;
  }
  return 0 === node.elements.length;
};

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
