import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";

import { isIdentifier, isMemberExpression } from "./../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferOptionalChaining";

type Options = [];

// Detect `x && x.foo` where left is an identifier and right is a member expression
// whose object is the same identifier. This is the simple 2-element chain that
// can become `x?.foo`. Longer chains are handled by prefer-get.
export const detectOptionalChainingPattern = (
  node: TSESTree.Node
): node is TSESTree.LogicalExpression => {
  if (AST_NODE_TYPES.LogicalExpression !== node.type) {
    return false;
  }
  const logical = node as TSESTree.LogicalExpression;
  if ("&&" !== logical.operator) {
    return false;
  }
  // Left must be an identifier
  if (!isIdentifier(logical.left)) {
    return false;
  }
  // Right must be a member expression whose object is the same identifier
  if (!isMemberExpression(logical.right)) {
    return false;
  }
  if (!isIdentifier(logical.right.object)) {
    return false;
  }
  return logical.left.name === logical.right.object.name;
};

const buildFix = (
  fixer: TSESLint.RuleFixer,
  node: TSESTree.LogicalExpression,
  sourceCode: TSESLint.SourceCode
): TSESLint.RuleFix => {
  // x && x.foo → x?.foo
  const rightText = sourceCode.getText(node.right);
  // Replace the member expression `x.foo` with `x?.foo`
  const memberExpr = node.right as TSESTree.MemberExpression;
  const objText = sourceCode.getText(memberExpr.object);
  const propText = sourceCode.getText(memberExpr.property);
  const replacement = memberExpr.computed
    ? `${objText}?.[${propText}]`
    : `${objText}?.${propText}`;
  return fixer.replaceText(node, replacement);
};

export const preferOptionalChainingRule = createRule<Options, MessageIds>({
  create(context) {
    const sourceCode = context.sourceCode;
    const listener: TSESLint.RuleListener = {
      LogicalExpression: (node) => {
        // Skip if this is part of a longer chain (parent is another LogicalExpression)
        // Longer chains are handled by prefer-get
        if (node.parent && AST_NODE_TYPES.LogicalExpression === node.parent.type) {
          return;
        }
        if (!detectOptionalChainingPattern(node)) {
          return;
        }
        context.report({
          fix: (fixer) => {
            return buildFix(fixer, node, sourceCode);
          },
          messageId: "preferOptionalChaining",
          node
        });
      }
    };
    return listener;
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Prefer optional chaining over `x && x.foo` guard patterns."
    },
    fixable: "code",
    messages: {
      preferOptionalChaining:
        "Prefer `x?.foo` over `x && x.foo`. Optional chaining is more concise and idiomatic."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-optional-chaining"
});
