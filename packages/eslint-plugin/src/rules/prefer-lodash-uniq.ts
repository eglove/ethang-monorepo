import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";

import {
  isCallExpression,
  isIdentifier,
  isNewExpression,
  isSpreadElement
} from "./../utils/type-guards.ts";

const SPREAD_SET = "[...new Set(arr)]";
const ARRAY_FROM_SET = "Array.from(new Set(arr))";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferLodashUniq";

type Options = [];

const getSetCalleeName = (newExpression: TSESTree.NewExpression) => {
  if (!isIdentifier(newExpression.callee)) {
    return null;
  }
  return newExpression.callee.name;
};

// Detect `[...new Set(expr)]` spread-of-set pattern. Returns the outer
// ArrayExpression plus the inner `new Set(expr)` NewExpression, or null.
export const getSpreadOfNewSet = (node: TSESTree.Node) => {
  if (AST_NODE_TYPES.ArrayExpression !== node.type) {
    return null;
  }
  const { elements } = node;
  const [only] = elements;
  if (isNil(only) || !isSpreadElement(only)) {
    return null;
  }
  if (AST_NODE_TYPES.NewExpression !== only.argument.type) {
    return null;
  }
  if ("Set" !== getSetCalleeName(only.argument)) {
    return null;
  }
  return { arrayExpr: node, newSet: only.argument };
};

// Whether `callee` is exactly `Array.from` (a non-computed MemberExpression
// whose object is the `Array` identifier and property is the `from` identifier).
const isArrayFromCallee = (
  callee: TSESTree.Node
): callee is TSESTree.MemberExpression => {
  if (AST_NODE_TYPES.MemberExpression !== callee.type) {
    return false;
  }
  if (callee.computed) {
    return false;
  }
  const { object, property } = callee;
  return (
    isIdentifier(object) &&
    "Array" === object.name &&
    isIdentifier(property) &&
    "from" === property.name
  );
};

// Detect `Array.from(new Set(expr))` pattern. Returns the outer CallExpression
// plus the inner `new Set(expr)` NewExpression, or null.
export const getArrayFromNewSet = (node: TSESTree.Node) => {
  if (!isCallExpression(node)) {
    return null;
  }
  const { arguments: callArguments, callee } = node;
  const [firstArgument] = callArguments;
  if (isNil(firstArgument)) {
    return null;
  }
  if (1 !== callArguments.length) {
    return null;
  }
  if (!isArrayFromCallee(callee)) {
    return null;
  }
  if (!isNewExpression(firstArgument)) {
    return null;
  }
  if ("Set" !== getSetCalleeName(firstArgument)) {
    return null;
  }
  return { callExpr: node, newSet: firstArgument };
};

// Extract the inner expression from `new Set(expr)` (the `expr`),
// or null when the Set call has no usable argument.
export const getSetArgument = (newExpression: TSESTree.NewExpression) => {
  const [argument] = newExpression.arguments;
  if (isNil(argument)) {
    return null;
  }
  if (AST_NODE_TYPES.SpreadElement === argument.type) {
    return null;
  }
  return argument;
};

export type UniqMatch =
  | {
      readonly arrayExpr: TSESTree.ArrayExpression;
      readonly innerExpr: TSESTree.Expression;
      readonly kind: "spread-set";
    }
  | {
      readonly callExpr: TSESTree.CallExpression;
      readonly innerExpr: TSESTree.Expression;
      readonly kind: "array-from-set";
    };

export const detectUniqPattern = (node: TSESTree.Node) => {
  const spread = getSpreadOfNewSet(node);
  if (!isNil(spread)) {
    const innerExpression = getSetArgument(spread.newSet);
    if (isNil(innerExpression)) {
      return null;
    }
    const match: UniqMatch = {
      arrayExpr: spread.arrayExpr,
      innerExpr: innerExpression,
      kind: "spread-set"
    };
    return match;
  }
  const arrayFrom = getArrayFromNewSet(node);
  if (!isNil(arrayFrom)) {
    const innerExpression = getSetArgument(arrayFrom.newSet);
    if (isNil(innerExpression)) {
      return null;
    }
    const match: UniqMatch = {
      callExpr: arrayFrom.callExpr,
      innerExpr: innerExpression,
      kind: "array-from-set"
    };
    return match;
  }
  return null;
};

const buildFix = (
  fixer: TSESLint.RuleFixer,
  node: TSESTree.Node,
  innerExpression: TSESTree.Expression,
  sourceCode: TSESLint.SourceCode
) => {
  const innerText = sourceCode.getText(innerExpression);
  return fixer.replaceText(node, `uniq(${innerText})`);
};

export const preferLodashUniqRule = createRule<Options, MessageIds>({
  create(context) {
    const { sourceCode } = context;
    const listener: TSESLint.RuleListener = {
      ArrayExpression: (node) => {
        const match = detectUniqPattern(node);
        if (isNil(match) || "spread-set" !== match.kind) {
          return;
        }
        context.report({
          fix: (fixer) => {
            return buildFix(
              fixer,
              match.arrayExpr,
              match.innerExpr,
              sourceCode
            );
          },
          messageId: "preferLodashUniq",
          node: match.arrayExpr
        });
      },
      CallExpression: (node) => {
        const match = detectUniqPattern(node);
        if (isNil(match) || "array-from-set" !== match.kind) {
          return;
        }
        context.report({
          fix: (fixer) => {
            return buildFix(fixer, match.callExpr, match.innerExpr, sourceCode);
          },
          messageId: "preferLodashUniq",
          node: match.callExpr
        });
      }
    };
    return listener;
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: `Prefer \`_.uniq\` over \`${SPREAD_SET}\` or \`${ARRAY_FROM_SET}\`.`
    },
    fixable: "code",
    messages: {
      preferLodashUniq: `Prefer \`uniq(arr)\` over \`${SPREAD_SET}\` or \`${ARRAY_FROM_SET}\`. Lodash handles deduplication directly.`
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-lodash-uniq"
});

export { ARRAY_FROM_SET, SPREAD_SET };
