import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";

import {
  isArrowFunctionExpression,
  isCallExpression,
  isIdentifier,
  isMemberExpression
} from "./../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferLodashIntersection";

type Options = [];

// `arr.filter(x => arr2.includes(x))` is the canonical shape this rule rewrites.
export const isFilterCall = (node: TSESTree.Node) => {
  if (!isCallExpression(node)) {
    return false;
  }
  const { callee } = node;
  if (!isMemberExpression(callee)) {
    return false;
  }
  if (callee.computed) {
    return false;
  }
  const { property } = callee;
  if (!isIdentifier(property)) {
    return false;
  }
  return "filter" === property.name;
};

export const getFilterCallTarget = (node: TSESTree.Node) => {
  if (!isCallExpression(node) || !isFilterCall(node)) {
    return null;
  }
  // isFilterCall already ensures callee is a non-computed MemberExpression with Identifier "filter"
  return node.callee;
};

export const getFirstIdentifierArgument = (node: TSESTree.CallExpression) => {
  const [first] = node.arguments;
  if (!first || !isIdentifier(first)) {
    return null;
  }
  return first;
};

export const getFirstArrowCallbackArgument = (
  node: TSESTree.CallExpression
) => {
  const [first] = node.arguments;
  if (!first || !isArrowFunctionExpression(first)) {
    return null;
  }
  return first;
};

export const getSingleIdentifierArrowParameter = (
  callback: TSESTree.ArrowFunctionExpression
) => {
  const [first] = callback.params;
  if (!first || 1 !== callback.params.length || !isIdentifier(first)) {
    return null;
  }
  return first;
};

export const getExpressionBody = (
  callback: TSESTree.ArrowFunctionExpression
) => {
  if (AST_NODE_TYPES.BlockStatement === callback.body.type) {
    return null;
  }
  return callback.body;
};

// Check if the callee.object is a safe expression (identifier or member expr, not the param itself).
const isSafeCalleeObject = (
  calleeObject: TSESTree.Expression,
  parameterName: string
) => {
  if (isIdentifier(calleeObject)) {
    return calleeObject.name !== parameterName;
  }
  return isMemberExpression(calleeObject);
};

// Check if `body` is `arr2.includes(param)` where `param` matches the arrow parameter.
export const isIncludesCallWithParameter = (
  body: TSESTree.Node,
  parameterName: string
): body is TSESTree.CallExpression => {
  if (!isCallExpression(body)) {
    return false;
  }
  const { callee } = body;
  if (!isMemberExpression(callee) || callee.computed) {
    return false;
  }
  const { property } = callee;
  if (!isIdentifier(property) || "includes" !== property.name) {
    return false;
  }
  // Exactly one argument — extra args (e.g. includes(x, 1)) change semantics
  if (1 !== body.arguments.length) {
    return false;
  }
  // Check that the argument is the parameter identifier
  const [argument] = body.arguments;
  if (!argument || !isIdentifier(argument) || argument.name !== parameterName) {
    return false;
  }
  return isSafeCalleeObject(callee.object, parameterName);
};

export type IntersectionMatch = {
  readonly arr1Expression: TSESTree.Expression;
  readonly arr2Expression: TSESTree.Expression;
  readonly callback: TSESTree.ArrowFunctionExpression;
  readonly filterCall: TSESTree.CallExpression;
};

export const detectIntersectionPattern = (node: TSESTree.CallExpression) => {
  if (!isFilterCall(node)) {
    return null;
  }
  const filterCallee = getFilterCallTarget(node);
  // filterCallee is non-null since isFilterCall passed
  const callback = getFirstArrowCallbackArgument(node);
  if (!callback) {
    return null;
  }
  const parameter = getSingleIdentifierArrowParameter(callback);
  if (!parameter) {
    return null;
  }
  const body = getExpressionBody(callback);
  if (!body) {
    return null;
  }
  if (!isIncludesCallWithParameter(body, parameter.name)) {
    return null;
  }
  // body.callee and filterCallee are MemberExpressions since guards passed
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const includesCallee = body.callee as TSESTree.MemberExpression;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const filterCalleeTarget = filterCallee as TSESTree.MemberExpression;
  const array2Expression = includesCallee.object;
  const array1Text = filterCalleeTarget.object;
  return {
    arr1Expression: array1Text,
    arr2Expression: array2Expression,
    callback,
    filterCall: node
  };
};

const buildFixes = (
  sourceCode: TSESLint.SourceCode,
  fixer: TSESLint.RuleFixer,
  outerNode: TSESTree.CallExpression,
  match: IntersectionMatch
) => {
  const { arr1Expression, arr2Expression } = match;
  const array1SourceText = sourceCode.getText(arr1Expression);
  const array2SourceText = sourceCode.getText(arr2Expression);
  return fixer.replaceText(
    outerNode,
    `intersection(${array1SourceText}, ${array2SourceText})`
  );
};

export const preferLodashIntersectionRule = createRule<Options, MessageIds>({
  create(context) {
    const { sourceCode } = context;

    const listener: TSESLint.RuleListener = {
      CallExpression: (node) => {
        const match = detectIntersectionPattern(node);
        if (!match) {
          return;
        }
        context.report({
          fix: (fixer) => {
            return buildFixes(sourceCode, fixer, node, match);
          },
          messageId: "preferLodashIntersection",
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
        "Prefer `_.intersection` over `arr.filter(x => arr2.includes(x))`."
    },
    fixable: "code",
    messages: {
      preferLodashIntersection:
        "Prefer `intersection(arrA, arrB)` over `arrA.filter(x => arrB.includes(x))`. Lodash handles the intersection logic directly."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-lodash-intersection"
});
