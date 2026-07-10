import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree
} from "@typescript-eslint/utils";
import every from "lodash/every.js";
import isString from "lodash/isString.js";
import join from "lodash/join.js";
import map from "lodash/map.js";
import replace from "lodash/replace.js";
import some from "lodash/some.js";
import toPath from "lodash/toPath.js";

import { isLodashCall, resolveCall } from "../utils/ast.ts";
import { getMainAlias } from "../utils/method-data.ts";
import {
  isArrayExpression,
  isLiteral,
  isTemplateLiteral
} from "../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "array" | "arrayForVariables" | "string" | "stringForSimple";

type Options = [PathStyle?];

type PathStyle = "array" | "as-needed" | "string";

const REGULAR_PATH_METHODS = new Set([
  "get",
  "has",
  "hasIn",
  "invoke",
  "set",
  "unset"
]);

const HIGHER_ORDER_PATH_METHODS = new Set(["matchesProperty", "property"]);

const isRegularPathMethod = (method: string): boolean => {
  const main = getMainAlias(method);
  return REGULAR_PATH_METHODS.has(main) || REGULAR_PATH_METHODS.has(method);
};

const isHigherOrderPathMethod = (method: string): boolean => {
  const main = getMainAlias(method);
  return (
    HIGHER_ORDER_PATH_METHODS.has(main) || HIGHER_ORDER_PATH_METHODS.has(method)
  );
};

export const getPathArgumentIndex = (method: string): number => {
  if (isRegularPathMethod(method)) {
    return 1;
  }
  if (isHigherOrderPathMethod(method)) {
    return 0;
  }
  return -1;
};

const isPropertyAccessCharacter = (char: string): boolean => {
  return "." === char || "[" === char;
};

const isEndsWithPropertyAccess = (value: string): boolean => {
  return isPropertyAccessCharacter(value.at(-1) ?? "");
};

const isStartsWithPropertyAccess = (value: string): boolean => {
  return isPropertyAccessCharacter(value[0] ?? "");
};

export const isStringConcatWithVariableProperties = (
  node: TSESTree.Node
): boolean => {
  if (node.type !== AST_NODE_TYPES.BinaryExpression || "+" !== node.operator) {
    return false;
  }

  const binary = node as TSESTree.BinaryExpression;
  const { left, right } = binary;

  if (
    isLiteral(left) &&
    isString(left.value) &&
    isEndsWithPropertyAccess(left.value)
  ) {
    return true;
  }

  return (
    isLiteral(right) &&
    isString(right.value) &&
    isStartsWithPropertyAccess(right.value)
  );
};

export const findQuasiAfterIndex = (
  expressionEnd: number,
  quasis: readonly TSESTree.TemplateElement[]
): number => {
  for (const [index, quasi] of quasis.entries()) {
    if (quasi.range[0] >= expressionEnd) {
      return index;
    }
  }
  return -1;
};

export const isAdjacentToPropertyAccessInTemplate = (
  expression: TSESTree.Expression,
  literal: TSESTree.TemplateLiteral
): boolean => {
  const [, expressionEnd] = expression.range;
  const quasiAfterIndex = findQuasiAfterIndex(expressionEnd, literal.quasis);

  if (0 > quasiAfterIndex) {
    return false;
  }

  const quasiBefore = literal.quasis[quasiAfterIndex - 1];
  const quasiAfter = literal.quasis[quasiAfterIndex];

  const isBeforeMatches =
    quasiBefore !== undefined &&
    isEndsWithPropertyAccess(quasiBefore.value.raw);

  const isAfterMatches =
    quasiAfter !== undefined &&
    isStartsWithPropertyAccess(quasiAfter.value.raw);

  return isBeforeMatches || isAfterMatches;
};

export const isTemplateLiteralWithVariableProperties = (
  node: TSESTree.Node
): boolean => {
  if (!isTemplateLiteral(node)) {
    return false;
  }

  return some(node.expressions, (expression) => {
    return isAdjacentToPropertyAccessInTemplate(expression, node);
  });
};

export const isArrayOfLiterals = (node: TSESTree.Node): boolean => {
  if (!isArrayExpression(node)) {
    return false;
  }

  return every(node.elements, (element) => {
    return null !== element && isLiteral(element);
  });
};

const canBeDotNotation = (value: string): boolean => {
  return /^[a-zA-Z0-9_$][\w$]*$/u.test(value);
};

export const convertToStringStyle = (
  node: TSESTree.ArrayExpression
): string => {
  const parts = map(node.elements, (element) => {
    if (null === element || !isLiteral(element)) {
      return "";
    }

    const stringValue = String(element.value);

    if (isString(element.value) && canBeDotNotation(stringValue)) {
      return `.${stringValue}`;
    }

    return `[${stringValue}]`;
  });

  return `'${replace(join(parts, ""), /^\./u, "")}'`;
};

export const convertToArrayStyle = (node: TSESTree.Literal): string => {
  const path = toPath(String(node.value));

  return `[${join(
    map(path, (segment) => {
      return `'${segment}'`;
    }),
    ", "
  )}]`;
};

export const pathStyleRule = createRule<Options, MessageIds>({
  create(context) {
    const [style = "as-needed"] = context.options;
    const program = context.sourceCode.ast;

    const reportAsNeeded = (node: TSESTree.Node): void => {
      if (isArrayExpression(node) && isArrayOfLiterals(node)) {
        context.report({
          fix: (fixer) => {
            return fixer.replaceText(node, convertToStringStyle(node));
          },
          messageId: "stringForSimple",
          node
        });
        return;
      }

      if (isStringConcatWithVariableProperties(node)) {
        context.report({ messageId: "arrayForVariables", node });
        return;
      }

      if (isTemplateLiteralWithVariableProperties(node)) {
        context.report({ messageId: "arrayForVariables", node });
      }
    };

    const reportArray = (node: TSESTree.Node): void => {
      if (isLiteral(node) && isString(node.value)) {
        context.report({
          fix: (fixer) => {
            return fixer.replaceText(node, convertToArrayStyle(node));
          },
          messageId: "array",
          node
        });
        return;
      }

      if (isTemplateLiteral(node)) {
        context.report({ messageId: "array", node });
      }
    };

    const reportString = (node: TSESTree.Node): void => {
      if (isArrayExpression(node)) {
        context.report({
          fix: (fixer) => {
            return fixer.replaceText(node, convertToStringStyle(node));
          },
          messageId: "string",
          node
        });
      }
    };

    const reportIfViolates = (node: TSESTree.Node): void => {
      if ("as-needed" === style) {
        reportAsNeeded(node);
        return;
      }

      if ("array" === style) {
        reportArray(node);
        return;
      }

      reportString(node);
    };

    const visitCallExpression = (node: TSESTree.CallExpression): void => {
      if (!isLodashCall(node, program)) {
        return;
      }

      const { methodName } = resolveCall(node, program);
      const index = getPathArgumentIndex(methodName);

      if (-1 === index) {
        return;
      }

      const argument = node.arguments[index];

      if (argument === undefined) {
        return;
      }

      reportIfViolates(argument);
    };

    return {
      CallExpression: visitCallExpression
    };
  },
  defaultOptions: ["as-needed"],
  meta: {
    docs: {
      description:
        "Enforce consistent path style (array or string) for lodash path methods."
    },
    fixable: "code",
    messages: {
      array: "Use an array for paths.",
      arrayForVariables: "Use an array for paths with variables.",
      string: "Use a string for paths.",
      stringForSimple: "Use a string for simple paths."
    },
    schema: [
      {
        enum: ["array", "as-needed", "string"],
        type: "string"
      }
    ],
    type: "suggestion"
  },
  name: "path-style"
});
