import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";

import {
  detectEntriesMapPattern,
  extractBodyExpression,
  validateArrayParameter
} from "../utils/lodash-map-utilities.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferLodashMapValues";

type Options = [];

// Validate that body returns [key, transformedValue] with key passthrough
export const validateReturnArray = (
  callbackFunction:
    TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression,
  keyName: string
) => {
  const bodyExpression = extractBodyExpression(callbackFunction);
  if (
    isNil(bodyExpression) ||
    AST_NODE_TYPES.ArrayExpression !== bodyExpression.type
  ) {
    return null;
  }
  const arrayExpression = bodyExpression;
  if (2 !== arrayExpression.elements.length) {
    return null;
  }
  const [first, second] = arrayExpression.elements;
  if (isNil(first) || AST_NODE_TYPES.Identifier !== first.type) {
    return null;
  }
  if (first.name !== keyName) {
    return null;
  }
  /* v8 ignore next 2 */
  if (!second) {
    return null;
  }
  // Reject SpreadElement — mapValues callback returns a plain expression
  if (AST_NODE_TYPES.SpreadElement === second.type) {
    return null;
  }
  return second;
};

// Check if the callback returns [key, newValue] where key is the same identifier passed through
export const findKeyPassthroughCallback = (callback: TSESTree.Node) => {
  if (
    AST_NODE_TYPES.ArrowFunctionExpression !== callback.type &&
    AST_NODE_TYPES.FunctionExpression !== callback.type
  ) {
    return null;
  }

  const callbackFunction = callback;
  const [parameter] = callbackFunction.params;
  if (!parameter) {
    return null;
  }

  const parameterInfo = validateArrayParameter(parameter);
  if (isNil(parameterInfo)) {
    return null;
  }

  const valueTransform = validateReturnArray(
    callbackFunction,
    parameterInfo.keyName
  );
  if (isNil(valueTransform)) {
    return null;
  }

  return {
    callback: callbackFunction,
    keyName: parameterInfo.keyName,
    valName: parameterInfo.valueName,
    valueTransform
  };
};

export type MapValuesMatch = {
  readonly fullCall: TSESTree.CallExpression;
  readonly objExpr: TSESTree.Expression;
  readonly valName: string;
  readonly valueTransform: TSESTree.Expression;
};

export const detectMapValuesPattern = (node: TSESTree.Node) => {
  const pattern = detectEntriesMapPattern(node);
  if (isNil(pattern)) {
    return null;
  }

  // Check callback passes key through unchanged
  const callbackInfo = findKeyPassthroughCallback(pattern.callback);
  if (isNil(callbackInfo)) {
    return null;
  }

  return {
    fullCall: pattern.fullCall,
    objExpr: pattern.objExpr,
    valName: callbackInfo.valName,
    valueTransform: callbackInfo.valueTransform
  };
};

const buildFix = (
  fixer: TSESLint.RuleFixer,
  match: MapValuesMatch,
  sourceCode: TSESLint.SourceCode
) => {
  const objectText = sourceCode.getText(match.objExpr);
  const transformText = sourceCode.getText(match.valueTransform);
  const replacement = `mapValues(${objectText}, ${match.valName} => ${transformText})`;
  return fixer.replaceText(match.fullCall, replacement);
};

export const preferLodashMapValuesRule = createRule<Options, MessageIds>({
  create(context) {
    const { sourceCode } = context;
    return {
      CallExpression: (node) => {
        const match = detectMapValuesPattern(node);
        if (isNil(match)) {
          return;
        }
        context.report({
          fix: (fixer) => {
            return buildFix(fixer, match, sourceCode);
          },
          messageId: "preferLodashMapValues",
          node: match.fullCall
        });
      }
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Prefer `_.mapValues(obj, fn)` over `Object.fromEntries(Object.entries(obj).map(...))`."
    },
    fixable: "code",
    messages: {
      preferLodashMapValues:
        "Prefer `mapValues(obj, fn)` over `Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]))`. Lodash provides a cleaner alternative."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-lodash-mapValues"
});
