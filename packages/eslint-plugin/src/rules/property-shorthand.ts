import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";

import { isLodashCall, resolveCall } from "../utils/ast.ts";
import { isPropertyShorthandMethod } from "../utils/method-data.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "noPropertyShorthand" | "preferPropertyShorthand";

type Mode = "always" | "never";

type Options = [Mode];

export const getValueReturnedInFirstStatement = (node: TSESTree.Expression) => {
  if (node.type === AST_NODE_TYPES.ArrowFunctionExpression) {
    if (node.body.type === AST_NODE_TYPES.BlockStatement) {
      const [first] = node.body.body;

      if (first?.type === AST_NODE_TYPES.ReturnStatement) {
        return first.argument ?? null;
      }

      return null;
    }

    return node.body;
  }

  if (node.type === AST_NODE_TYPES.FunctionExpression) {
    const [first] = node.body.body;

    if (first?.type === AST_NODE_TYPES.ReturnStatement) {
      return first.argument ?? null;
    }
  }

  return null;
};

export const getFirstParameterName = (node: null | TSESTree.Expression) => {
  if (
    isNil(node) ||
    (node.type !== AST_NODE_TYPES.FunctionExpression &&
      node.type !== AST_NODE_TYPES.ArrowFunctionExpression)
  ) {
    return null;
  }

  const [firstParameter] = node.params;

  return firstParameter?.type === AST_NODE_TYPES.Identifier
    ? firstParameter.name
    : null;
};

// Checks if the returned expression is a member expression of the first parameter,
// e.g. x.name or x.user.name (non-computed only).
export const isMemberExpressionOf = (
  node: null | TSESTree.Expression,
  parameterName: null | string
) => {
  if (isNil(parameterName) || isNil(node)) {
    return false;
  }

  let current: TSESTree.Expression = node;

  while (current.type === AST_NODE_TYPES.MemberExpression) {
    if (current.computed) {
      return false;
    }

    if (
      current.object.type === AST_NODE_TYPES.Identifier &&
      current.object.name === parameterName
    ) {
      return true;
    }

    current = current.object;
  }

  return false;
};

// Checks if the iteratee is a function that returns a property of its first parameter.
export const isExplicitPropertyFunction = (
  iteratee: null | TSESTree.Expression
) => {
  if (
    isNil(iteratee) ||
    (iteratee.type !== AST_NODE_TYPES.FunctionExpression &&
      iteratee.type !== AST_NODE_TYPES.ArrowFunctionExpression)
  ) {
    return false;
  }

  const firstParameterName = getFirstParameterName(iteratee);

  if (isNil(firstParameterName)) {
    return false;
  }

  const returned = getValueReturnedInFirstStatement(iteratee);

  return isMemberExpressionOf(returned, firstParameterName);
};

// Checks if the iteratee is _.property('name') or lodash.property('name').
export const isLodashPropertyCall = (iteratee: null | TSESTree.Expression) => {
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
    "property" === property.name
  );
};

const canUsePropertyShorthand = (iteratee: null | TSESTree.Expression) => {
  return isExplicitPropertyFunction(iteratee) || isLodashPropertyCall(iteratee);
};

// Checks if the iteratee is a string literal (property shorthand usage).
export const isStringLiteral = (iteratee: null | TSESTree.Expression) => {
  return iteratee?.type === AST_NODE_TYPES.Literal && isString(iteratee.value);
};

export const propertyShorthandRule = createRule<Options, MessageIds>({
  create(context) {
    // eslint-disable-next-line @typescript-eslint/no-useless-default-assignment -- context.options is [] at runtime when no options configured
    const [mode = "always"] = context.options;
    const program = context.sourceCode.ast;
    const isNeverMode = "never" === mode;

    const checkNode = (node: TSESTree.CallExpression) => {
      if (!isLodashCall(node, program)) {
        return;
      }

      const { methodName } = resolveCall(node, program);

      if (!isPropertyShorthandMethod(methodName)) {
        return;
      }

      const [, iteratee] = node.arguments;

      if (isNeverMode) {
        if (
          !isNil(iteratee) &&
          iteratee.type !== AST_NODE_TYPES.SpreadElement &&
          isStringLiteral(iteratee)
        ) {
          context.report({
            messageId: "noPropertyShorthand",
            node: iteratee
          });
        }

        return;
      }

      if (
        !isNil(iteratee) &&
        iteratee.type !== AST_NODE_TYPES.SpreadElement &&
        canUsePropertyShorthand(iteratee)
      ) {
        context.report({
          messageId: "preferPropertyShorthand",
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
        "Prefer property shorthand syntax (e.g. _.map(xs, 'name') over _.map(xs, x => x.name))."
    },
    messages: {
      noPropertyShorthand: "Do not use the property shorthand syntax.",
      preferPropertyShorthand: "Prefer property shorthand syntax."
    },
    schema: [
      {
        enum: ["always", "never"],
        type: "string"
      }
    ],
    type: "problem"
  },
  name: "property-shorthand"
});
