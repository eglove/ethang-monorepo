import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";

import { isCallExpression, isIdentifier } from "./../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferLodashUniq";

type Options = [];

// Detect `[...new Set(expr)]` spread-of-set pattern
export const isSpreadOfNewSet = (
  node: TSESTree.Node
): node is TSESTree.ArrayExpression => {
  if (AST_NODE_TYPES.ArrayExpression !== node.type) {
    return false;
  }
  const elements = node.elements;
  if (1 !== elements.length) {
    return false;
  }
  const [only] = elements;
  if (!only) {
    return false;
  }
  if (AST_NODE_TYPES.SpreadElement !== only.type) {
    return false;
  }
  if (AST_NODE_TYPES.NewExpression !== only.argument.type) {
    return false;
  }
  const newExpr = only.argument;
  if (AST_NODE_TYPES.Identifier !== newExpr.callee.type) {
    return false;
  }
  return "Set" === newExpr.callee.name;
};

// Detect `Array.from(new Set(expr))` pattern
export const isArrayFromNewSet = (
  node: TSESTree.Node
): node is TSESTree.CallExpression => {
  if (!isCallExpression(node)) {
    return false;
  }
  const { callee, arguments: args } = node;
  if (1 !== args.length) {
    return false;
  }
  // callee is `Array.from` — a MemberExpression
  if (AST_NODE_TYPES.MemberExpression !== callee.type) {
    return false;
  }
  if (callee.computed) {
    return false;
  }
  const { object, property } = callee;
  if (!isIdentifier(object) || "Array" !== object.name) {
    return false;
  }
  if (!isIdentifier(property) || "from" !== property.name) {
    return false;
  }
  if (AST_NODE_TYPES.NewExpression !== args[0].type) {
    return false;
  }
  const newExpr = args[0] as TSESTree.NewExpression;
  if (AST_NODE_TYPES.Identifier !== newExpr.callee.type) {
    return false;
  }
  return "Set" === newExpr.callee.name;
};

// Extract the inner expression from `new Set(expr)`
export const getSetArgument = (
  newExpr: TSESTree.NewExpression
): TSESTree.Expression | null => {
  const [arg] = newExpr.arguments;
  if (!arg) {
    return null;
  }
  if (AST_NODE_TYPES.SpreadElement === arg.type) {
    return null;
  }
  return arg;
};

export type UniqMatch =
  | { readonly kind: "spread-set"; readonly arrayExpr: TSESTree.ArrayExpression; readonly innerExpr: TSESTree.Expression }
  | { readonly kind: "array-from-set"; readonly callExpr: TSESTree.CallExpression; readonly innerExpr: TSESTree.Expression };

export const detectUniqPattern = (node: TSESTree.Node): UniqMatch | null => {
  if (isSpreadOfNewSet(node)) {
    const [only] = node.elements;
    if (!only || AST_NODE_TYPES.SpreadElement !== only.type) {
      return null;
    }
    const innerExpr = getSetArgument(only.argument);
    if (!innerExpr) {
      return null;
    }
    return { kind: "spread-set", arrayExpr: node, innerExpr };
  }
  if (isArrayFromNewSet(node)) {
    const [arg] = node.arguments;
    if (!arg || AST_NODE_TYPES.NewExpression !== arg.type) {
      return null;
    }
    const innerExpr = getSetArgument(arg);
    if (!innerExpr) {
      return null;
    }
    return { kind: "array-from-set", callExpr: node, innerExpr };
  }
  return null;
};

const buildFix = (
  fixer: TSESLint.RuleFixer,
  node: TSESTree.Node,
  innerExpr: TSESTree.Expression,
  sourceCode: TSESLint.SourceCode
): TSESLint.RuleFix => {
  const innerText = sourceCode.getText(innerExpr);
  return fixer.replaceText(node, `uniq(${innerText})`);
};

export const preferLodashUniqRule = createRule<Options, MessageIds>({
  create(context) {
    const sourceCode = context.sourceCode;
    const listener: TSESLint.RuleListener = {
      ArrayExpression: (node) => {
        const match = detectUniqPattern(node);
        if (!match) {
          return;
        }
        context.report({
          fix: (fixer) => {
            return buildFix(fixer, match.arrayExpr, match.innerExpr, sourceCode);
          },
          messageId: "preferLodashUniq",
          node: match.arrayExpr
        });
      },
      CallExpression: (node) => {
        const match = detectUniqPattern(node);
        if (!match) {
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
      description:
        "Prefer `_.uniq` over `[...new Set(arr)]` or `Array.from(new Set(arr))`."
    },
    fixable: "code",
    messages: {
      preferLodashUniq:
        "Prefer `uniq(arr)` over `[...new Set(arr)]` or `Array.from(new Set(arr))`. Lodash handles deduplication directly."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-lodash-uniq"
});
