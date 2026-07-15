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

type MessageIds = "noNullUndefinedCheck";

type Options = [];

const isNullOrUndefinedNode = (node: TSESTree.Node): boolean => {
  // null is a Literal with value null
  if (AST_NODE_TYPES.Literal === node.type && isNil(node.value)) {
    return true;
  }

  // undefined is an Identifier with name "undefined"
  if (AST_NODE_TYPES.Identifier === node.type && "undefined" === node.name) {
    return true;
  }

  return false;
};

const checkNullUndefinedEquality = (
  node: TSESTree.BinaryExpression,
  sourceCode: TSESLint.SourceCode
): { readonly isNegated: boolean; readonly variable: string } | null => {
  const equalityOperators = new Set(["!=", "!==", "==", "==="]);
  if (!equalityOperators.has(node.operator)) {
    return null;
  }

  const isNegated = "!=" === node.operator || "!==" === node.operator;

  if (isNullOrUndefinedNode(node.right)) {
    const variableText = sourceCode.getText(node.left);
    return { isNegated, variable: variableText };
  }

  if (isNullOrUndefinedNode(node.left)) {
    const variableText = sourceCode.getText(node.right);
    return { isNegated, variable: variableText };
  }

  return null;
};

const checkTypeofUndefined = (
  node: TSESTree.BinaryExpression,
  sourceCode: TSESLint.SourceCode
): { readonly isNegated: boolean; readonly variable: string } | null => {
  const isNegated = "!=" === node.operator || "!==" === node.operator;

  // typeof x === 'undefined'
  if (
    AST_NODE_TYPES.UnaryExpression === node.left.type &&
    "typeof" === node.left.operator
  ) {
    if (
      AST_NODE_TYPES.Literal === node.right.type &&
      "undefined" === node.right.value
    ) {
      const argumentText = sourceCode.getText(node.left.argument);
      return { isNegated, variable: argumentText };
    }
    return null;
  }

  // 'undefined' === typeof x
  if (
    AST_NODE_TYPES.Literal === node.left.type &&
    "undefined" === node.left.value &&
    AST_NODE_TYPES.UnaryExpression === node.right.type &&
    "typeof" === node.right.operator
  ) {
    const argumentText = sourceCode.getText(node.right.argument);
    return { isNegated, variable: argumentText };
  }

  return null;
};

export const noNullUndefinedCheckRule = createRule<Options, MessageIds>({
  create(context) {
    const { sourceCode } = context;

    return {
      BinaryExpression: (node: TSESTree.BinaryExpression) => {
        // Skip if this is part of a logical OR chain (x === null || x === undefined)
        // That pattern is handled by the prefer-lodash rule's preferIsNil check

        const { parent } = node;
        if (
          AST_NODE_TYPES.LogicalExpression === parent.type &&
          "||" === parent.operator
        ) {
          return;
        }

        const equalityResult = checkNullUndefinedEquality(node, sourceCode);
        if (equalityResult) {
          const { isNegated, variable } = equalityResult;
          const suggestion = isNegated
            ? `!isNil(${variable})`
            : `isNil(${variable})`;

          context.report({
            data: { suggestion },
            messageId: "noNullUndefinedCheck",
            node
          });
          return;
        }

        const typeofResult = checkTypeofUndefined(node, sourceCode);
        if (typeofResult) {
          const { isNegated, variable } = typeofResult;
          const suggestion = isNegated
            ? `!isNil(${variable})`
            : `isNil(${variable})`;

          context.report({
            data: { suggestion },
            messageId: "noNullUndefinedCheck",
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
        "Disallow direct null/undefined checks; require lodash/isNil instead."
    },
    messages: {
      noNullUndefinedCheck:
        "Prefer `{{suggestion}}` from `lodash/isNil` over direct null/undefined check."
    },
    schema: [],
    type: "suggestion"
  },
  name: "no-null-undefined-check"
});
