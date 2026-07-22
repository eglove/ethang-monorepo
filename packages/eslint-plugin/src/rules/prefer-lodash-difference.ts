import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferLodashDifference";

type Options = [];

// Reuse helpers from intersection pattern - they detect the same .filter() shape.
import {
  getExpressionBody,
  getFilterCallTarget,
  getFirstArrowCallbackArgument,
  getSingleIdentifierArrowParameter,
  isFilterCall,
  isIncludesCallWithParameter
} from "./prefer-lodash-intersection.ts";

export {
  getExpressionBody,
  getFilterCallTarget,
  getFirstArrowCallbackArgument,
  getFirstIdentifierArgument,
  getSingleIdentifierArrowParameter,
  isFilterCall,
  isIncludesCallWithParameter
} from "./prefer-lodash-intersection.ts";

// Check if `body` is `!arr2.includes(param)` where `param` matches the arrow parameter.
export const isNegatedIncludesCallWithParameter = (
  body: TSESTree.Node,
  parameterName: string
): body is TSESTree.UnaryExpression => {
  if (AST_NODE_TYPES.UnaryExpression !== body.type) {
    return false;
  }
  if ("!" !== body.operator) {
    return false;
  }
  return isIncludesCallWithParameter(body.argument, parameterName);
};

export type DifferenceMatch = {
  readonly arr1Expression: TSESTree.Expression;
  readonly arr2Expression: TSESTree.Expression;
  readonly callback: TSESTree.ArrowFunctionExpression;
  readonly filterCall: TSESTree.CallExpression;
};

export const detectDifferencePattern = (node: TSESTree.CallExpression) => {
  if (!isFilterCall(node)) {
    return null;
  }
  const filterCallee = getFilterCallTarget(node);
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
  if (!isNegatedIncludesCallWithParameter(body, parameter.name)) {
    return null;
  }
  // body.argument is the includes call since isNegatedIncludesCallWithParameter passed
  // which internally calls isIncludesCallWithParameter ensuring CallExpression
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const includesCall = body.argument as TSESTree.CallExpression;
  // includesCall.callee is MemberExpression since isIncludesCallWithParameter passed
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const includesCallee = includesCall.callee as TSESTree.MemberExpression;
  // filterCallee is MemberExpression since isFilterCall passed
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const filterCalleeTarget = filterCallee as TSESTree.MemberExpression;
  const array2Expression = includesCallee.object;
  const array1Expression = filterCalleeTarget.object;
  return {
    arr1Expression: array1Expression,
    arr2Expression: array2Expression,
    callback,
    filterCall: node
  };
};

const buildFixes = (
  sourceCode: TSESLint.SourceCode,
  fixer: TSESLint.RuleFixer,
  outerNode: TSESTree.CallExpression,
  match: DifferenceMatch
) => {
  const { arr1Expression, arr2Expression } = match;
  const array1SourceText = sourceCode.getText(arr1Expression);
  const array2SourceText = sourceCode.getText(arr2Expression);
  return fixer.replaceText(
    outerNode,
    `difference(${array1SourceText}, ${array2SourceText})`
  );
};

export const preferLodashDifferenceRule = createRule<Options, MessageIds>({
  create(context) {
    const { sourceCode } = context;

    const listener: TSESLint.RuleListener = {
      CallExpression: (node) => {
        const match = detectDifferencePattern(node);
        if (!match) {
          return;
        }
        context.report({
          fix: (fixer) => {
            return buildFixes(sourceCode, fixer, node, match);
          },
          messageId: "preferLodashDifference",
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
        "Prefer `_.difference` over `arr.filter(x => !arr2.includes(x))`."
    },
    fixable: "code",
    messages: {
      preferLodashDifference:
        "Prefer `difference(arrA, arrB)` over `arrA.filter(x => !arrB.includes(x))`. Lodash handles the difference logic directly."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-lodash-difference"
});
