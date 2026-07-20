import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";

import { isIdentifier } from "./../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferLodashFromPairs";

type Options = [];

// Detect `Object.fromEntries(pairs)` pattern
export const isObjectFromEntriesCall = (
  node: TSESTree.Node
): node is TSESTree.CallExpression => {
  if (AST_NODE_TYPES.CallExpression !== node.type) {
    return false;
  }
  const { callee, arguments: args } = node;
  if (1 !== args.length) {
    return false;
  }
  if (AST_NODE_TYPES.MemberExpression !== callee.type) {
    return false;
  }
  if (callee.computed) {
    return false;
  }
  if (!isIdentifier(callee.object) || "Object" !== callee.object.name) {
    return false;
  }
  if (!isIdentifier(callee.property) || "fromEntries" !== callee.property.name) {
    return false;
  }
  return true;
};

const buildFix = (
  fixer: TSESLint.RuleFixer,
  node: TSESTree.CallExpression,
  sourceCode: TSESLint.SourceCode
): TSESLint.RuleFix => {
  const [arg] = node.arguments;
  const argText = arg ? sourceCode.getText(arg) : "";
  return fixer.replaceText(node, `fromPairs(${argText})`);
};

export const preferLodashFromPairsRule = createRule<Options, MessageIds>({
  create(context) {
    const sourceCode = context.sourceCode;
    const listener: TSESLint.RuleListener = {
      CallExpression: (node) => {
        if (!isObjectFromEntriesCall(node)) {
          return;
        }
        context.report({
          fix: (fixer) => {
            return buildFix(fixer, node, sourceCode);
          },
          messageId: "preferLodashFromPairs",
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
        "Prefer `_.fromPairs` over `Object.fromEntries`."
    },
    fixable: "code",
    messages: {
      preferLodashFromPairs:
        "Prefer `fromPairs(pairs)` over `Object.fromEntries(pairs)`. Lodash provides fromPairs for consistency with other array utilities."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-lodash-from-pairs"
});
