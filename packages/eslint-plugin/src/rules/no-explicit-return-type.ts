import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

export type NoExplicitReturnTypeOptions = [];

type FunctionLikeNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.TSDeclareFunction
  | TSESTree.TSEmptyBodyFunctionExpression;

type MessageIds = "explicitReturnType";

export const noExplicitReturnTypeRule = createRule<
  NoExplicitReturnTypeOptions,
  MessageIds
>({
  create(context) {
    const check = (returnTypeNode: TSESTree.TSTypeAnnotation) => {
      context.report({
        fix: (fixer) => {
          const tokenBefore = context.sourceCode.getTokenBefore(returnTypeNode);
          /* v8 ignore next -- defensive guard: a return type annotation always has a preceding token */
          if (isNil(tokenBefore)) {
            return null;
          }

          return fixer.removeRange([
            tokenBefore.range[1],
            returnTypeNode.range[1]
          ]);
        },
        messageId: "explicitReturnType",
        node: returnTypeNode
      });
    };

    const checkFunctionLike = (functionNode: FunctionLikeNode) => {
      const { returnType } = functionNode;
      if (isNil(returnType)) {
        return;
      }
      // Type predicates (e.g. `node is Foo`) are the consumer-narrowing
      // mechanism — they aren't return-type *annotations* in the
      // documentation sense, so they're exempt.
      if (AST_NODE_TYPES.TSTypePredicate === returnType.typeAnnotation.type) {
        return;
      }
      check(returnType);
    };

    const listener: TSESLint.RuleListener = {
      "ArrowFunctionExpression, FunctionDeclaration, FunctionExpression, TSDeclareFunction, TSEmptyBodyFunctionExpression"(
        node
      ) {
        checkFunctionLike(node);
      }
    };

    return listener;
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Ban all explicit return type annotations. Auto-fix removes the annotation (see AGENTS.md rule 6)."
    },
    fixable: "code",
    messages: {
      explicitReturnType:
        "Explicit return types are not allowed. Remove the annotation (see AGENTS.md rule 6)."
    },
    schema: [],
    type: "suggestion"
  },
  name: "no-explicit-return-type"
});
