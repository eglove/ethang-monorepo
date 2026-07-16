import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";

import { isLodashCall, resolveCall } from "../utils/ast.ts";
import { isMatchesShorthandMethod } from "../utils/method-data.ts";
import {
  getFirstParameterName,
  getValueReturnedInFirstStatement,
  isEqualityToMemberOf
} from "./matches-shorthand.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "noMatchesPropShorthand" | "preferMatchesPropShorthand";

type Mode = "always" | "never";

type Options = [Mode?, { onlyLiterals?: boolean }?];

const DEFAULT_MAX_PROPERTY_PATH_LENGTH = 3;

// Checks if the iteratee is _.matchesProperty(path, value) or lodash.matchesProperty(path, value).
export const isLodashMatchesPropertyCall = (
  iteratee: null | TSESTree.Expression
) => {
  if (iteratee?.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }

  const { callee } = iteratee;

  if (callee.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }

  const { object, property } = callee;

  if (
    object.type !== AST_NODE_TYPES.Identifier ||
    property.type !== AST_NODE_TYPES.Identifier
  ) {
    return false;
  }

  return (
    ("_" === object.name || "lodash" === object.name) &&
    "matchesProperty" === property.name
  );
};

// Checks if the iteratee is an array literal (matches-prop shorthand usage).
export const isArrayLiteral = (iteratee: null | TSESTree.Expression) => {
  return iteratee?.type === AST_NODE_TYPES.ArrayExpression;
};

// Checks if the iteratee is a function returning a single === comparison to a member of the parameter.
export const isFunctionReturningEqualityToMember = (
  iteratee: null | TSESTree.Expression,
  maxPropertyPathLength: number,
  isAllowComputed: boolean,
  isOnlyLiterals: boolean
) => {
  if (
    isNil(iteratee) ||
    (iteratee.type !== AST_NODE_TYPES.FunctionExpression &&
      iteratee.type !== AST_NODE_TYPES.ArrowFunctionExpression)
  ) {
    return false;
  }

  const parameterName = getFirstParameterName(iteratee);

  if (isNil(parameterName)) {
    return false;
  }

  const returned = getValueReturnedInFirstStatement(iteratee);

  return isEqualityToMemberOf(
    returned,
    parameterName,
    maxPropertyPathLength,
    isAllowComputed,
    isOnlyLiterals
  );
};

export const matchesPropertyShorthandRule = createRule<Options, MessageIds>({
  create(context) {
    const [mode = "always", onlyLiteralsOption] = context.options;
    const program = context.sourceCode.ast;
    const isNeverMode = "never" === mode;
    const isOnlyLiterals = Boolean(onlyLiteralsOption?.onlyLiterals);

    const checkNeverMode = (iteratee: TSESTree.CallExpressionArgument) => {
      if (
        iteratee.type !== AST_NODE_TYPES.SpreadElement &&
        isArrayLiteral(iteratee)
      ) {
        context.report({
          messageId: "noMatchesPropShorthand",
          node: iteratee
        });
      }
    };

    const checkAlwaysMode = (iteratee: TSESTree.CallExpressionArgument) => {
      if (
        iteratee.type !== AST_NODE_TYPES.SpreadElement &&
        (isFunctionReturningEqualityToMember(
          iteratee,
          DEFAULT_MAX_PROPERTY_PATH_LENGTH,
          false,
          isOnlyLiterals
        ) ||
          isLodashMatchesPropertyCall(iteratee))
      ) {
        context.report({
          messageId: "preferMatchesPropShorthand",
          node: iteratee
        });
      }
    };

    const checkNode = (node: TSESTree.CallExpression) => {
      if (!isLodashCall(node, program)) {
        return;
      }

      const { methodName } = resolveCall(node, program);

      if (!isMatchesShorthandMethod(methodName)) {
        return;
      }

      const [, iteratee] = node.arguments;

      if (isNil(iteratee)) {
        return;
      }

      if (isNeverMode) {
        checkNeverMode(iteratee);
        return;
      }

      checkAlwaysMode(iteratee);
    };

    return {
      CallExpression: checkNode
    };
  },
  defaultOptions: ["always", {}],
  meta: {
    docs: {
      description:
        "Prefer matches-property shorthand syntax (e.g. _.filter(xs, ['key', value]) over _.filter(xs, x => x.key === value))."
    },
    messages: {
      noMatchesPropShorthand:
        "Do not use the matches-property shorthand syntax.",
      preferMatchesPropShorthand: "Prefer matches-property shorthand syntax."
    },
    schema: [
      {
        enum: ["always", "never"],
        type: "string"
      },
      {
        properties: {
          onlyLiterals: {
            type: "boolean"
          }
        },
        type: "object"
      }
    ],
    type: "problem"
  },
  name: "matches-prop-shorthand"
});
