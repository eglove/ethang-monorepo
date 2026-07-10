import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree
} from "@typescript-eslint/utils";

import { isLodashCall, resolveCall } from "../utils/ast.ts";
import { isIdentityShorthandMethod } from "../utils/method-data.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "noIdentityShorthand" | "preferOmitIdentity";

type Mode = "always" | "never";

type Options = [Mode];

const getValueReturnedInFirstStatement = (
  node: TSESTree.Expression
): TSESTree.Expression | undefined => {
  if (node.type === AST_NODE_TYPES.ArrowFunctionExpression) {
    if (node.body.type === AST_NODE_TYPES.BlockStatement) {
      const [first] = node.body.body;

      if (first?.type === AST_NODE_TYPES.ReturnStatement) {
        return first.argument ?? undefined;
      }

      return undefined;
    }

    return node.body;
  }

  /* v8 ignore next 7 -- isExplicitIdentityFunction ensures node is FunctionExpression when ArrowFunctionExpression is already handled above */
  if (node.type === AST_NODE_TYPES.FunctionExpression) {
    const [first] = node.body.body;

    if (first?.type === AST_NODE_TYPES.ReturnStatement) {
      return first.argument ?? undefined;
    }
  }

  return undefined;
};

const isExplicitIdentityFunction = (
  iteratee: TSESTree.Expression | undefined
): boolean => {
  if (
    iteratee === undefined ||
    (iteratee.type !== AST_NODE_TYPES.FunctionExpression &&
      iteratee.type !== AST_NODE_TYPES.ArrowFunctionExpression)
  ) {
    return false;
  }

  const [firstParameter] = iteratee.params;

  if (firstParameter?.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }

  const returned = getValueReturnedInFirstStatement(iteratee);

  return (
    returned?.type === AST_NODE_TYPES.Identifier &&
    returned.name === firstParameter.name
  );
};

const isLodashIdentityMember = (
  iteratee: TSESTree.Expression | undefined
): boolean => {
  if (iteratee?.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }

  const { object, property } = iteratee;

  if (
    object.type !== AST_NODE_TYPES.Identifier ||
    property.type !== AST_NODE_TYPES.Identifier
  ) {
    return false;
  }

  return (
    ("_" === object.name || "lodash" === object.name) &&
    "identity" === property.name
  );
};

const isIdentityFunction = (
  iteratee: TSESTree.Expression | undefined
): boolean => {
  return (
    isExplicitIdentityFunction(iteratee) || isLodashIdentityMember(iteratee)
  );
};

export const identityShorthandRule = createRule<Options, MessageIds>({
  create(context) {
    // eslint-disable-next-line @typescript-eslint/no-useless-default-assignment -- context.options is [] at runtime when no options configured
    const [mode = "always"] = context.options;
    const program = context.sourceCode.ast;
    const isNeverMode = "never" === mode;

    const checkNode = (node: TSESTree.CallExpression): void => {
      if (!isLodashCall(node, program)) {
        return;
      }

      const { methodName } = resolveCall(node, program);

      if (!isIdentityShorthandMethod(methodName)) {
        return;
      }

      const [, iteratee] = node.arguments;

      if (isNeverMode) {
        if (iteratee === undefined) {
          context.report({
            messageId: "noIdentityShorthand",
            node
          });
        }

        return;
      }

      if (
        iteratee !== undefined &&
        iteratee.type !== AST_NODE_TYPES.SpreadElement &&
        isIdentityFunction(iteratee)
      ) {
        context.report({
          messageId: "preferOmitIdentity",
          node: iteratee
        });
      }
    };

    return {
      CallExpression: checkNode
    };
  },
  defaultOptions: ["always"],
  meta: {
    docs: {
      description:
        "Prefer omitting the iteratee when an identity function is used (e.g. _.filter(xs) over _.filter(xs, x => x))."
    },
    messages: {
      noIdentityShorthand:
        "Do not use the identity shorthand syntax; pass an explicit iteratee.",
      preferOmitIdentity:
        "Prefer omitting the iteratee over a function that returns its argument."
    },
    schema: [
      {
        enum: ["always", "never"],
        type: "string"
      }
    ],
    type: "problem"
  },
  name: "identity-shorthand"
});
