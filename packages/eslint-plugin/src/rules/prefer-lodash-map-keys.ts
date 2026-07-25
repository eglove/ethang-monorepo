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

type MessageIds = "preferLodashMapKeys";

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

  // Check callback passes value through unchanged
  const callbackInfo = findValuePassthroughCallback(callback);
  if (isNil(callbackInfo)) {
    return null;
  }

  return {
    fullCall: node,
    keyName: callbackInfo.keyName,
    keyTransform: callbackInfo.keyTransform,
    objExpr: objectArgument
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
