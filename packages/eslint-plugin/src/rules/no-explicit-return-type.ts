import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";
import some from "lodash/some.js";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

const EFFECT_ROOT_NAMES = new Set([
  "Chunk",
  "Effect",
  "Layer",
  "Option",
  "Stream"
]);

const EFFECT_NAMESPACE_NAMES = new Set([
  "Context",
  "Effect",
  "Error",
  "Option",
  "Requirements",
  "Success"
]);

const isRootEffectName: (
  left: TSESTree.Identifier,
  right: TSESTree.Identifier
) => boolean = (left, right) => {
  const isRoot = "Effect" === left.name;
  const isModule = EFFECT_ROOT_NAMES.has(right.name);
  return isRoot && isModule;
};

const isNamespaceEffectName: (
  left: TSESTree.TSQualifiedName,
  right: TSESTree.Identifier
) => boolean = (left, right) => {
  const isModule = EFFECT_NAMESPACE_NAMES.has(right.name);
  return isModule && isEffectQualifiedName(left);
};

const isEffectQualifiedName: (node: TSESTree.TSQualifiedName) => boolean = (
  node
) => {
  const { left, right } = node;
  if (left.type === AST_NODE_TYPES.Identifier) {
    return isRootEffectName(left, right);
  }

  if (left.type === AST_NODE_TYPES.TSQualifiedName) {
    return isNamespaceEffectName(left, right);
  }

  return false;
};

const isEffectReturnType: (typeNode: TSESTree.TypeNode) => boolean = (
  typeNode
) => {
  if (typeNode.type === AST_NODE_TYPES.TSTypeReference) {
    const { typeArguments, typeName } = typeNode;
    if (
      typeName.type === AST_NODE_TYPES.Identifier &&
      "Effect" === typeName.name
    ) {
      return true;
    }
    if (
      typeName.type === AST_NODE_TYPES.TSQualifiedName &&
      isEffectQualifiedName(typeName)
    ) {
      return true;
    }
    // Promise<Effect<...>> — recurse into the type arguments when present.
    if (!isNil(typeArguments)) {
      return some(typeArguments.params, (parameter) => {
        return isEffectReturnType(parameter);
      });
    }
    return false;
  }
  if (typeNode.type === AST_NODE_TYPES.TSUnionType) {
    return some(typeNode.types, (type) => {
      return isEffectReturnType(type);
    });
  }
  if (typeNode.type === AST_NODE_TYPES.TSIntersectionType) {
    return some(typeNode.types, (type) => {
      return isEffectReturnType(type);
    });
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
