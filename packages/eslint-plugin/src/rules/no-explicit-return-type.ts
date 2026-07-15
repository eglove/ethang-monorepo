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

// True if the return-type annotation is an Effect type we need to preserve.
// Matches: `Effect<...>`, `Effect.Effect<...>`, `Effect.Effect.Success<...>`,
// `Effect.Effect.Error<...>`, `Effect.Effect.Context<...>`, and
// `Effect.Option<...>`. We also handle `Promise<Effect<...>>` wrappers.
const isEffectReturnType = (typeNode: TSESTree.TypeNode): boolean => {
  if (typeNode.type === AST_NODE_TYPES.TSTypeReference) {
    const { typeName, typeArguments } = typeNode;
    if (typeName.type === AST_NODE_TYPES.Identifier) {
      if (typeName.name === "Effect") {
        return true;
      }
    }
    if (typeName.type === AST_NODE_TYPES.TSQualifiedName) {
      if (isEffectQualifiedName(typeName)) {
        return true;
      }
    }
    // Promise<Effect<...>> — recurse into the type arguments.
    if (typeArguments !== undefined) {
      return typeArguments.params.some(isEffectReturnType);
    }
  }
  // Union / intersection — recurse into both halves.
  if (typeNode.type === AST_NODE_TYPES.TSUnionType) {
    return typeNode.types.some(isEffectReturnType);
  }
  if (typeNode.type === AST_NODE_TYPES.TSIntersectionType) {
    return typeNode.types.some(isEffectReturnType);
  }
  return false;
};

const isEffectQualifiedName = (node: TSESTree.TSQualifiedName): boolean => {
  const { left, right } = node;
  if (right.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }
  if (left.type === AST_NODE_TYPES.Identifier) {
    return (
      left.name === "Effect" &&
      (right.name === "Effect" ||
        right.name === "Option" ||
        right.name === "Stream" ||
        right.name === "Chunk" ||
        right.name === "Layer")
    );
  }
  if (left.type === AST_NODE_TYPES.TSQualifiedName) {
    return (
      isEffectQualifiedName(left) &&
      (right.name === "Success" ||
        right.name === "Error" ||
        right.name === "Context" ||
        right.name === "Requirements" ||
        right.name === "Effect" ||
        right.name === "Option")
    );
  }
  return false;
};

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
      // Effect-returning functions (e.g. `Effect<...>`, `Effect.Effect<...>`)
      // are exempt: removing the annotation widens the inferred type and
      // breaks Effect combinator inference downstream.
      if (isEffectReturnType(returnType.typeAnnotation)) {
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
