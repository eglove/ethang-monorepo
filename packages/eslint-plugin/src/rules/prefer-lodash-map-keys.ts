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

type MessageIds = "preferLodashMapKeys";

type Options = [];

// Validate that body returns [transformedKey, val] with val passthrough
export const validateReturnArray = (
  callbackFunction:
    TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression,
  valueName: string
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
  if (isNil(first)) {
    return null;
  }
  // Reject SpreadElement — mapKeys callback returns a plain expression as key
  if (AST_NODE_TYPES.SpreadElement === first.type) {
    return null;
  }
  if (isNil(second) || AST_NODE_TYPES.Identifier !== second.type) {
    return null;
  }
  if (second.name !== valueName) {
    return null;
  }
  return first;
};

// Check if the callback returns [newKey, val] where val is the same identifier passed through
export const findValuePassthroughCallback = (callback: TSESTree.Node) => {
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

  const keyTransform = validateReturnArray(
    callbackFunction,
    parameterInfo.valueName
  );
  if (isNil(keyTransform)) {
    return null;
  }

  return {
    callback: callbackFunction,
    keyName: parameterInfo.keyName,
    keyTransform,
    valName: parameterInfo.valueName
  };
};

export type MapKeysMatch = {
  readonly fullCall: TSESTree.CallExpression;
  readonly keyName: string;
  readonly keyTransform: TSESTree.Expression;
  readonly objExpr: TSESTree.Expression;
};

export const detectMapKeysPattern = (node: TSESTree.Node) => {
  const pattern = detectEntriesMapPattern(node);
  if (isNil(pattern)) {
    return null;
  }

  // Check callback passes value through unchanged
  const callbackInfo = findValuePassthroughCallback(pattern.callback);
  if (isNil(callbackInfo)) {
    return null;
  }

  return {
    fullCall: pattern.fullCall,
    keyName: callbackInfo.keyName,
    keyTransform: callbackInfo.keyTransform,
    objExpr: pattern.objExpr
  };
};

const buildFix = (
  fixer: TSESLint.RuleFixer,
  match: MapKeysMatch,
  sourceCode: TSESLint.SourceCode
) => {
  const objectText = sourceCode.getText(match.objExpr);
  const transformText = sourceCode.getText(match.keyTransform);
  const replacement = `mapKeys(${objectText}, ${match.keyName} => ${transformText})`;
  return fixer.replaceText(match.fullCall, replacement);
};

export const preferLodashMapKeysRule = createRule<Options, MessageIds>({
  create(context) {
    const { sourceCode } = context;
    return {
      CallExpression: (node) => {
        const match = detectMapKeysPattern(node);
        if (isNil(match)) {
          return;
        }
        context.report({
          fix: (fixer) => {
            return buildFix(fixer, match, sourceCode);
          },
          messageId: "preferLodashMapKeys",
          node: match.fullCall
        });
      }
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Prefer `_.mapKeys(obj, fn)` over `Object.fromEntries(Object.entries(obj).map(...))`."
    },
    fixable: "code",
    messages: {
      preferLodashMapKeys:
        "Prefer `mapKeys(obj, fn)` over `Object.fromEntries(Object.entries(obj).map(([k, v]) => [fn(k), v]))`. Lodash provides a cleaner alternative."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-lodash-mapKeys"
});
