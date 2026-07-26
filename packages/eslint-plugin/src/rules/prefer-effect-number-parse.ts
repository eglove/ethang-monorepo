import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";

import { isCallExpression, isIdentifier } from "./../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferEffectNumberParse";

type Options = [];

const NUMBER = "Number";
const PARSE_FLOAT = "parseFloat";

const isNumberCallExpression = (
  node: TSESTree.Node
): node is TSESTree.CallExpression => {
  if (!isCallExpression(node)) {
    return false;
  }
  if (!isIdentifier(node.callee)) {
    return false;
  }
  return NUMBER === node.callee.name;
};

const isParseFloatCallExpression = (
  node: TSESTree.Node
): node is TSESTree.CallExpression => {
  if (!isCallExpression(node)) {
    return false;
  }
  if (!isIdentifier(node.callee)) {
    return false;
  }
  return PARSE_FLOAT === node.callee.name;
};

// True when `node` is `Number(arg)` with exactly one non-spread argument.
export const detectNumberCoercion = (node: TSESTree.Node) => {
  if (!isNumberCallExpression(node)) {
    return null;
  }
  if (1 !== node.arguments.length) {
    return null;
  }
  const argument = node.arguments[0];
  if (argument?.type === AST_NODE_TYPES.SpreadElement) {
    return null;
  }
  return argument;
};

// True when `node` is `parseFloat(arg)` with exactly one non-spread argument.
export const detectParseFloat = (node: TSESTree.Node) => {
  if (!isParseFloatCallExpression(node)) {
    return null;
  }
  if (1 !== node.arguments.length) {
    return null;
  }
  const argument = node.arguments[0];
  if (argument?.type === AST_NODE_TYPES.SpreadElement) {
    return null;
  }
  return argument;
};

export const preferEffectNumberParseRule = createRule<Options, MessageIds>({
  create: (context) => {
    return {
      CallExpression: (node) => {
        const numberArgument = detectNumberCoercion(node);
        const parseFloatArgument = detectParseFloat(node);
        if (!isNil(numberArgument) || !isNil(parseFloatArgument)) {
          context.report({
            messageId: "preferEffectNumberParse",
            node
          });
        }
      }
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Prefer `Number.parse` (from `effect/Number`) over `Number(x)` coercion and `parseFloat(x)`."
    },
    messages: {
      preferEffectNumberParse:
        "Prefer `Number.parse` (from `effect/Number`) over `Number(x)` or `parseFloat(x)`. Add `import { Number } from 'effect';` after applying the fix."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-effect-number-parse"
});
