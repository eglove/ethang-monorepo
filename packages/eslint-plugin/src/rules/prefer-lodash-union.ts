import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import filter from "lodash/filter.js";
import isNil from "lodash/isNil.js";

import { isArrayExpression, isIdentifier } from "./../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferLodashUnion";

type Options = [];

// Extract the expression from a spread element: `...expr` -> expr
export const getSpreadArgument = (node: TSESTree.Node) => {
  if (AST_NODE_TYPES.SpreadElement !== node.type) {
    return null;
  }
  return node.argument;
};

// Check if a NewExpression is `new Set(...)`
export const isNewSetCall = (
  node: TSESTree.Node
): node is TSESTree.NewExpression => {
  if (AST_NODE_TYPES.NewExpression !== node.type) {
    return false;
  }
  if (!isIdentifier(node.callee)) {
    return false;
  }
  return "Set" === node.callee.name;
};

// Extract array expressions from spread elements in an array: [...a, ...b] -> [a, b]
export const extractSpreadArrays = (array: TSESTree.ArrayExpression) => {
  const elements: TSESTree.Expression[] = [];
  const arrayElements = filter(array.elements, (value) => {
    return !isNil(value);
  });

  for (const element of arrayElements) {
    const spreadArgument = getSpreadArgument(element);
    if (!spreadArgument) {
      return null;
    }
    elements.push(spreadArgument);
  }
  return elements;
};

export type UnionMatch = {
  readonly arrays: TSESTree.Expression[];
  readonly outerArray: TSESTree.ArrayExpression;
};

// Validate the outer spread is a new Set call with one argument
const validateOuterSpread = (spreadArgument: TSESTree.Expression) => {
  if (!isNewSetCall(spreadArgument)) {
    return null;
  }
  if (1 !== spreadArgument.arguments.length) {
    return null;
  }
  const [firstArgument] = spreadArgument.arguments;
  // Unreachable: arguments.length === 1 guarantees arguments[0] exists

  if (!firstArgument) {
    return null;
  }
  if (!isArrayExpression(firstArgument)) {
    return null;
  }
  return firstArgument;
};

// Detect `[...new Set([...a, ...b])]` pattern
export const detectUnionPattern = (node: TSESTree.Node) => {
  if (!isArrayExpression(node)) {
    return null;
  }
  // Outer array should have exactly one element: a spread
  if (1 !== node.elements.length) {
    return null;
  }
  const [outerElement] = node.elements;
  if (!outerElement) {
    return null;
  }
  const spreadArgument = getSpreadArgument(outerElement);
  if (!spreadArgument) {
    return null;
  }
  const innerArray = validateOuterSpread(spreadArgument);
  if (!innerArray) {
    return null;
  }
  const arrays = extractSpreadArrays(innerArray);
  if (!arrays || 0 === arrays.length) {
    return null;
  }
  return {
    arrays,
    outerArray: node
  };
};

const buildFix = (
  sourceCode: TSESLint.SourceCode,
  fixer: TSESLint.RuleFixer,
  node: TSESTree.ArrayExpression,
  match: UnionMatch
) => {
  const arraysText = match.arrays.map((array) => {
    return sourceCode.getText(array);
  });
  return fixer.replaceText(node, `union([${arraysText.join(", ")}])`);
};

export const preferLodashUnionRule = createRule<Options, MessageIds>({
  create(context) {
    const { sourceCode } = context;

    const listener: TSESLint.RuleListener = {
      ArrayExpression: (node) => {
        const match = detectUnionPattern(node);
        if (!match) {
          return;
        }
        context.report({
          fix: (fixer) => {
            return buildFix(sourceCode, fixer, node, match);
          },
          messageId: "preferLodashUnion",
          node
        });
      }
    };

    return listener;
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Prefer `_.union` over `[...new Set([...a, ...b])]`."
    },
    fixable: "code",
    messages: {
      preferLodashUnion:
        "Prefer `union([a, b])` over `[...new Set([...a, ...b])]`. Lodash handles the union logic directly."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-lodash-union"
});
