import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";
import some from "lodash/some.js";
import trim from "lodash/trim.js";
import { type Node, TypeFlags, type TypeNode } from "typescript";

import { getParserServices } from "../utils/ast.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

export type NoRedundantReturnTypeOptions = [
  {
    ignoreExports?: boolean;
  }
];

type FunctionLikeNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.TSDeclareFunction;

type MessageIds = "redundantReturnType";

const defaultOptions: NoRedundantReturnTypeOptions[number] = {
  ignoreExports: false
};

const isInferable = (flags: TypeFlags): boolean => {
  // eslint-disable-next-line no-bitwise -- TypeFlags is a bitfield enum
  if (0 !== (flags & TypeFlags.Any)) {
    return true;
  }

  // eslint-disable-next-line no-bitwise -- TypeFlags is a bitfield enum
  if (0 !== (flags & TypeFlags.Unknown)) {
    return true;
  }

  return false;
};

const hasGenericParameters = (functionNode: FunctionLikeNode): boolean => {
  if (functionNode.typeParameters === undefined) {
    return false;
  }

  return 0 < functionNode.typeParameters.params.length;
};

const isOverload = (functionNode: FunctionLikeNode): boolean => {
  if (AST_NODE_TYPES.TSDeclareFunction === functionNode.type) {
    return true;
  }

  const { body } = functionNode;

  return AST_NODE_TYPES.BlockStatement === body.type && 0 === body.body.length;
};

const isExported = (
  context: TSESLint.RuleContext<MessageIds, NoRedundantReturnTypeOptions>,
  functionNode: TSESTree.Node
): boolean => {
  const ancestors = context.sourceCode.getAncestors(functionNode);
  return some(ancestors, (ancestor) => {
    return AST_NODE_TYPES.ExportNamedDeclaration === ancestor.type;
  });
};

const isStringEqual = (left: string, right: string): boolean => {
  const normalizedLeft = trim(left.replaceAll(/\s+/gu, " "));
  const normalizedRight = trim(right.replaceAll(/\s+/gu, " "));
  return normalizedLeft === normalizedRight;
};

export const noRedundantExplicitReturnTypeRule = createRule<
  NoRedundantReturnTypeOptions,
  MessageIds
>({
  create(context, [options]) {
    const settings = { ...defaultOptions, ...options };
    const services = getParserServices(context);
    const checker = services.program.getTypeChecker();

    const check = (
      returnTypeNode: TSESTree.TSTypeAnnotation,
      functionNode: FunctionLikeNode
    ) => {
      if (
        true === settings.ignoreExports &&
        isExported(context, functionNode)
      ) {
        return;
      }

      if (hasGenericParameters(functionNode)) {
        return;
      }

      if (isOverload(functionNode)) {
        return;
      }

      const functionTsNode = services.esTreeNodeToTSNodeMap.get(functionNode);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- TS compiler API types don't align with TSESTree
      const annotationTsNode = services.esTreeNodeToTSNodeMap.get(
        returnTypeNode.typeAnnotation
      ) as unknown as TypeNode;

      const explicitTypeNode = checker.getTypeFromTypeNode(annotationTsNode);

      if (isInferable(explicitTypeNode.flags)) {
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- TS compiler API types don't align with TSESTree
      const tsNodeWithBody = functionTsNode as unknown as {
        body: Node;
      } & Node;
      const bodyNode = tsNodeWithBody.body;
      const bodyType = checker.getTypeAtLocation(bodyNode);
      const widenedBodyType = bodyType.isLiteral()
        ? checker.getBaseTypeOfLiteralType(bodyType)
        : bodyType;

      if (isInferable(widenedBodyType.flags)) {
        return;
      }

      const bodyTypeString = checker.typeToString(widenedBodyType);
      const explicitString = checker.typeToString(explicitTypeNode);

      if (!isStringEqual(bodyTypeString, explicitString)) {
        return;
      }

      context.report({
        data: { type: explicitString },
        fix: (fixer) => {
          const tokenBefore = context.sourceCode.getTokenBefore(returnTypeNode);
          /* v8 ignore next -- defensive guard: a return type annotation always has a preceding token */
          if (null === tokenBefore) {
            return null;
          }

          return fixer.removeRange([
            tokenBefore.range[1],
            returnTypeNode.range[1]
          ]);
        },
        messageId: "redundantReturnType",
        node: returnTypeNode
      });
    };

    const checkFunctionLike = (functionNode: FunctionLikeNode): void => {
      if (isNil(functionNode.returnType)) {
        return;
      }
      check(functionNode.returnType, functionNode);
    };

    const listener: TSESLint.RuleListener = {
      ArrowFunctionExpression(node) {
        checkFunctionLike(node);
      },
      FunctionDeclaration(node) {
        checkFunctionLike(node);
      },
      FunctionExpression(node) {
        checkFunctionLike(node);
      },
      MethodDefinition(node) {
        const { value } = node;
        if (value.type === AST_NODE_TYPES.FunctionExpression) {
          checkFunctionLike(value);
        }
      },
      TSDeclareFunction(node) {
        checkFunctionLike(node);
      }
    };

    return listener;
  },
  defaultOptions: [defaultOptions],
  meta: {
    docs: {
      description:
        "Disallow explicit return type annotations that are exactly the same as the inferred type. Auto-fix removes the redundant annotation."
    },
    fixable: "code",
    messages: {
      redundantReturnType:
        "The explicit return type `{{type}}` matches the inferred return type. Remove the annotation (see AGENTS.md rule 6)."
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          ignoreExports: { type: "boolean" }
        },
        type: "object"
      }
    ],
    type: "suggestion"
  },
  name: "no-redundant-explicit-return-type"
});
