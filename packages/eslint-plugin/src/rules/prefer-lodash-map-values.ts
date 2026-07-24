import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";

import { isCallExpression, isIdentifier } from "../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferLodashMapValues";

type Options = [];

// Check if callee is Object.entries
export const isObjectEntriesCall = (
  node: TSESTree.Node
): node is TSESTree.CallExpression => {
  if (!isCallExpression(node)) {
    return false;
  }
  const { callee } = node;
  /* v8 ignore next 2 -- unreachable: isCallExpression guarantees callee exists */
  if (AST_NODE_TYPES.MemberExpression !== callee.type) {
    return false;
  }
  if (callee.computed) {
    return false;
  }
  if (!isIdentifier(callee.object) || "Object" !== callee.object.name) {
    return false;
  }
  if (!isIdentifier(callee.property) || "entries" !== callee.property.name) {
    return false;
  }
  return true;
};

// Check if callee is Object.fromEntries
export const isObjectFromEntriesCall = (
  node: TSESTree.Node
): node is TSESTree.CallExpression => {
  if (!isCallExpression(node)) {
    return false;
  }
  const { callee } = node;
  if (AST_NODE_TYPES.MemberExpression !== callee.type) {
    return false;
  }
  if (callee.computed) {
    return false;
  }
  if (!isIdentifier(callee.object) || "Object" !== callee.object.name) {
    return false;
  }
  if (
    !isIdentifier(callee.property) ||
    "fromEntries" !== callee.property.name
  ) {
    return false;
  }
  return true;
};

// Check if a CallExpression is a .map() call
export const isMapCall = (
  node: TSESTree.Node
): node is TSESTree.CallExpression => {
  if (!isCallExpression(node)) {
    return false;
  }
  const { callee } = node;
  if (AST_NODE_TYPES.MemberExpression !== callee.type) {
    return false;
  }
  if (callee.computed) {
    return false;
  }
  if (!isIdentifier(callee.property) || "map" !== callee.property.name) {
    return false;
  }
  return true;
};

// Extract body expression from function (block with single return or expression body)
export const extractBodyExpression = (
  callbackFunction:
    TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression
) => {
  if (AST_NODE_TYPES.BlockStatement !== callbackFunction.body.type) {
    return callbackFunction.body;
  }
  const block = callbackFunction.body;
  if (1 !== block.body.length) {
    return null;
  }
  const [statement] = block.body;
  /* v8 ignore next 3 */
  if (!statement) {
    return null;
  }
  if (AST_NODE_TYPES.ReturnStatement !== statement.type) {
    return null;
  }
  return statement.argument ?? null;
};

// Check if the callback param is [key, val] pattern with both as identifiers
export const validateArrayParameter = (parameter: TSESTree.Node) => {
  if (AST_NODE_TYPES.ArrayPattern !== parameter.type) {
    return null;
  }
  const [keyPat, valuePat] = parameter.elements;
  if (!keyPat || !valuePat) {
    return null;
  }
  if (
    AST_NODE_TYPES.Identifier !== keyPat.type ||
    AST_NODE_TYPES.Identifier !== valuePat.type
  ) {
    return null;
  }
  return { keyName: keyPat.name, valueName: valuePat.name };
};

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
  // Layer 1: Object.fromEntries(...)
  if (!isObjectFromEntriesCall(node)) {
    return null;
  }

  const [argument1] = node.arguments;
  if (!argument1) {
    return null;
  }

  // Layer 2: .map(callback)
  if (!isMapCall(argument1)) {
    return null;
  }

  const mapCall = argument1;
  const [callback] = mapCall.arguments;
  if (!callback) {
    return null;
  }

  // Layer 3: Object.entries(obj) as mapCall.callee.object
  const mapCallee = mapCall.callee;
  /* v8 ignore next 3 -- unreachable: isMapCall already guarantees callee is MemberExpression */
  if (AST_NODE_TYPES.MemberExpression !== mapCallee.type) {
    return null;
  }

  const entriesCall = mapCallee.object;
  if (!isObjectEntriesCall(entriesCall)) {
    return null;
  }

  const [objectArgument] = entriesCall.arguments;
  if (!objectArgument) {
    return null;
  }

  // Reject spread argument - Object.entries expects a plain expression
  if (AST_NODE_TYPES.SpreadElement === objectArgument.type) {
    return null;
  }

  // Check callback passes key through unchanged
  const callbackInfo = findKeyPassthroughCallback(callback);
  if (isNil(callbackInfo)) {
    return null;
  }

  return {
    fullCall: node,
    objExpr: objectArgument,
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
