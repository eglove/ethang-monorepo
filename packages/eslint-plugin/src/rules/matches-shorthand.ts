import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";

import { isLodashCall, resolveCall } from "../utils/ast.ts";
import { isMatchesShorthandMethod } from "../utils/method-data.ts";
import { isExpression } from "../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "noMatchesShorthand" | "preferMatchesShorthand";

type Mode = "always" | "never";

type Options = [Mode?, number?, boolean?, { onlyLiterals?: boolean }?];

const DEFAULT_MAX_PROPERTY_PATH_LENGTH = 3;

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

  /* v8 ignore next 7 -- isFunctionReturningConjunction ensures node is FunctionExpression when ArrowFunctionExpression is already handled above */
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

// Checks if a node is a strict equality comparison (===).
const isStrictEquality = (
  node: null | TSESTree.Expression
): node is TSESTree.BinaryExpression => {
  return (
    node?.type === AST_NODE_TYPES.BinaryExpression && "===" === node.operator
  );
};

// Checks if a node is a conjunction (LogicalExpression with &&).
const isConjunction = (
  node: null | TSESTree.Expression
): node is TSESTree.LogicalExpression => {
  return (
    node?.type === AST_NODE_TYPES.LogicalExpression && "&&" === node.operator
  );
};

// Checks if the expression is a member expression of the parameter name,
// up to maxLength depth, non-computed only (unless isAllowComputed is true).
export const isMemberExpressionOf = (
  node: null | TSESTree.Expression,
  parameterName: null | string,
  maxLength: number,
  isAllowComputed: boolean
) => {
  if (isNil(parameterName) || isNil(node)) {
    return false;
  }

  let current: TSESTree.Expression = node;
  let depth = maxLength;

  while (0 < depth) {
    if (current.type === AST_NODE_TYPES.MemberExpression) {
      if (!isAllowComputed && current.computed) {
        return false;
      }

      if (
        current.object.type === AST_NODE_TYPES.Identifier &&
        current.object.name === parameterName
      ) {
        return true;
      }

      current = current.object;
      depth -= 1;
    } else {
      return false;
    }
  }

  return false;
};

// Checks if a node is a literal.
const isLiteral = (node: null | TSESTree.Expression) => {
  return node?.type === AST_NODE_TYPES.Literal;
};

// Checks if the expression is `===` where one side is a member expression of
// the parameter and the other side is a literal (or any value if onlyLiterals
// is false).
export const isEqualityToMemberOf = (
  expression: null | TSESTree.Expression,
  parameterName: null | string,
  maxLength: number,
  isAllowComputed: boolean,
  isOnlyLiterals: boolean
) => {
  if (!isStrictEquality(expression) || isNil(parameterName)) {
    return false;
  }

  const { left, right } = expression;
  const leftExpression = isExpression(left) ? left : null;
  const rightExpression = isExpression(right) ? right : null;
  const isLeftMember = isMemberExpressionOf(
    leftExpression,
    parameterName,
    maxLength,
    isAllowComputed
  );
  const isRightMember = isMemberExpressionOf(
    rightExpression,
    parameterName,
    maxLength,
    isAllowComputed
  );

  // Exactly one side must be a member expression of the parameter
  if (isLeftMember === isRightMember) {
    return false;
  }

  if (isOnlyLiterals) {
    return isLiteral(leftExpression) || isLiteral(rightExpression);
  }

  return true;
};

// Iteratively walks a conjunction tree and verifies every leaf is a strict
// equality to a member of the parameter.
export const isConjunctionOfEqualitiesToMemberOf = (
  expression: null | TSESTree.Expression,
  parameterName: null | string,
  maxLength: number,
  isAllowComputed: boolean,
  isOnlyLiterals: boolean
) => {
  if (isNil(parameterName) || isNil(expression)) {
    return false;
  }

  const stack: TSESTree.Expression[] = [expression];

  while (0 < stack.length) {
    const current = stack.pop();

    /* v8 ignore next -- defensive guard: current is always pushed/popped via the stack, never null at this point */
    if (!isNil(current)) {
      const isMatch = processConjunctionLeaf(
        current,
        stack,
        parameterName,
        maxLength,
        isAllowComputed,
        isOnlyLiterals
      );

      if (!isMatch) {
        return false;
      }
    }
  }

  return true;
};

const processConjunctionLeaf = (
  current: TSESTree.Expression,
  stack: TSESTree.Expression[],
  parameterName: string,
  maxLength: number,
  isAllowComputed: boolean,
  isOnlyLiterals: boolean
) => {
  if (isStrictEquality(current)) {
    return isEqualityToMemberOf(
      current,
      parameterName,
      maxLength,
      isAllowComputed,
      isOnlyLiterals
    );
  }

  if (isConjunction(current)) {
    stack.push(current.right, current.left);
    return true;
  }

  return false;
};

// Checks if the iteratee is a function returning a conjunction of === comparisons.
export const isFunctionReturningConjunction = (
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

  return isConjunctionOfEqualitiesToMemberOf(
    returned,
    parameterName,
    maxPropertyPathLength,
    isAllowComputed,
    isOnlyLiterals
  );
};

// Checks if the iteratee is _.matches({...}) or lodash.matches({...}).
export const isLodashMatchesCall = (iteratee: null | TSESTree.Expression) => {
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
    "matches" === property.name
  );
};

// Checks if the iteratee is an object literal (matches shorthand usage).
const isObjectLiteral = (iteratee: null | TSESTree.Expression) => {
  return iteratee?.type === AST_NODE_TYPES.ObjectExpression;
};

export const matchesShorthandRule = createRule<Options, MessageIds>({
  create(context) {
    const [
      mode = "always",
      maxPropertyPathLength = DEFAULT_MAX_PROPERTY_PATH_LENGTH,
      isAllowComputed = false,
      onlyLiteralsOption
    ] = context.options;
    const program = context.sourceCode.ast;
    const isNeverMode = "never" === mode;
    const isOnlyLiterals = Boolean(onlyLiteralsOption?.onlyLiterals);

    const checkNeverMode = (iteratee: TSESTree.CallExpressionArgument) => {
      if (
        iteratee.type !== AST_NODE_TYPES.SpreadElement &&
        isObjectLiteral(iteratee)
      ) {
        context.report({
          messageId: "noMatchesShorthand",
          node: iteratee
        });
      }
    };

    const checkAlwaysMode = (iteratee: TSESTree.CallExpressionArgument) => {
      if (
        iteratee.type !== AST_NODE_TYPES.SpreadElement &&
        (isFunctionReturningConjunction(
          iteratee,
          maxPropertyPathLength,
          isAllowComputed,
          isOnlyLiterals
        ) ||
          isLodashMatchesCall(iteratee))
      ) {
        context.report({
          messageId: "preferMatchesShorthand",
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
  defaultOptions: ["always", DEFAULT_MAX_PROPERTY_PATH_LENGTH, false, {}],
  meta: {
    docs: {
      description:
        "Prefer matches shorthand syntax (e.g. _.filter(xs, { active: true }) over _.filter(xs, x => x.active === true))."
    },
    messages: {
      noMatchesShorthand: "Do not use the matches shorthand syntax.",
      preferMatchesShorthand: "Prefer matches shorthand syntax."
    },
    schema: [
      {
        enum: ["always", "never"],
        type: "string"
      },
      {
        minimum: 1,
        type: "integer"
      },
      {
        type: "boolean"
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
  name: "matches-shorthand"
});
