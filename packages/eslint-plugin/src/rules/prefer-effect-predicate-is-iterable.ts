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

type MessageIds = "preferEffectPredicateIsIterable";

type Options = [];

// Detect `Symbol.iterator in x` pattern
export const detectSymbolIteratorIn = (node: TSESTree.Node) => {
  if (AST_NODE_TYPES.BinaryExpression !== node.type) {
    return false;
  }
  const binary = node;
  if ("in" !== binary.operator) {
    return false;
  }
  // Left side must be Symbol.iterator
  if (!isMemberExpression(binary.left)) {
    return false;
  }
  const { left } = binary;
  if (!isIdentifier(left.object)) {
    return false;
  }
  if (!isIdentifier(left.property)) {
    return false;
  }
  return "Symbol" === left.object.name && "iterator" === left.property.name;
};

export const preferEffectPredicateIsIterableRule = createRule<
  Options,
  MessageIds
>({
  create(context) {
    const listener: TSESLint.RuleListener = {
      BinaryExpression: (node) => {
        if (!detectSymbolIteratorIn(node)) {
          return;
        }
        context.report({
          messageId: "preferEffectPredicateIsIterable",
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
        "Prefer `Predicate.isIterable(x)` over `Symbol.iterator in x`."
    },
    messages: {
      preferEffectPredicateIsIterable:
        "Prefer `Predicate.isIterable(x)` over `Symbol.iterator in x`. Effect Predicate provides a safer, more composable type guard."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-effect-predicate-is-iterable"
});
