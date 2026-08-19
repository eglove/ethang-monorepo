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

type MessageIds = "preferEffectCause";

type Options = [];

// Detect `x instanceof Error` and similar patterns where the right
// side of `instanceof` is an identifier whose name ends with "Error".
// This covers built-in error types (Error, TypeError, SyntaxError,
// ReferenceError, RangeError, URIError, EvalError, AggregateError)
// and custom errors that extend Error (MyError, ValidationError, etc.).
export const isInstanceofError = (
  node: TSESTree.Node
): node is TSESTree.BinaryExpression => {
  if (AST_NODE_TYPES.BinaryExpression !== node.type) {
    return false;
  }
  const binary = node;
  if ("instanceof" !== binary.operator) {
    return false;
  }
  if (!isIdentifier(binary.right)) {
    return false;
  }
  return binary.right.name.endsWith("Error");
};

export const preferEffectCauseRule = createRule<Options, MessageIds>({
  create(context) {
    const listener: TSESLint.RuleListener = {
      BinaryExpression: (node) => {
        if (!isInstanceofError(node)) {
          return;
        }
        context.report({
          messageId: "preferEffectCause",
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
        "Avoid `instanceof Error` checks. Use `Effect.catchTags` with tagged errors (`_tag` discriminators) or `Cause.failureOption` for Cause inspection instead."
    },
    messages: {
      preferEffectCause:
        "Avoid `instanceof Error` checks. Use `Effect.catchTags` with tagged errors (`_tag` discriminators) or `Cause.failureOption` for Cause inspection instead."
    },
    schema: [],
    type: "suggestion"
  },
  name: "prefer-effect-cause"
});
