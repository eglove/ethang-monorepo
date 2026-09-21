import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";

import { isCallExpression, isIdentifier } from "./type-guards.ts";

// Check if the callee is a non-computed member expression on the `Object`
// identifier (i.e. a static `Object.<method>` access).
const isObjectMemberCallee = (
  callee: TSESTree.Node
): callee is TSESTree.MemberExpression => {
  return (
    AST_NODE_TYPES.MemberExpression === callee.type &&
    !callee.computed &&
    isIdentifier(callee.object) &&
    "Object" === callee.object.name
  );
};

// Shared detection for `Object.<methodName>(...)` static calls
const isObjectStaticMethodCall = (
  node: TSESTree.Node,
  methodName: string
): node is TSESTree.CallExpression => {
  if (!isCallExpression(node)) {
    return false;
  }
  const { callee } = node;

  return (
    isObjectMemberCallee(callee) &&
    isIdentifier(callee.property) &&
    methodName === callee.property.name
  );
};

// Check if callee is Object.entries
export const isObjectEntriesCall = (
  node: TSESTree.Node
): node is TSESTree.CallExpression => {
  return isObjectStaticMethodCall(node, "entries");
};

// Check if callee is Object.fromEntries
export const isObjectFromEntriesCall = (
  node: TSESTree.Node
): node is TSESTree.CallExpression => {
  return isObjectStaticMethodCall(node, "fromEntries");
};

// Check if a CallExpression is a .map() call
export const isMapCall = (
  node: TSESTree.Node
): node is TSESTree.CallExpression => {
  if (!isCallExpression(node)) {
    return false;
  }
  const { callee } = node;
  return (
    AST_NODE_TYPES.MemberExpression === callee.type &&
    !callee.computed &&
    isIdentifier(callee.property) &&
    "map" === callee.property.name
  );
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

  return AST_NODE_TYPES.ReturnStatement === statement?.type
    ? (statement.argument ?? null)
    : null;
};

// Check if a destructuring element is a plain Identifier pattern
const isIdentifierPattern = (
  pattern: null | TSESTree.Node | undefined
): pattern is TSESTree.Identifier => {
  return !isNil(pattern) && AST_NODE_TYPES.Identifier === pattern.type;
};

// Check if the callback param is [key, val] pattern with both as identifiers
export const validateArrayParameter = (parameter: TSESTree.Node) => {
  if (AST_NODE_TYPES.ArrayPattern !== parameter.type) {
    return null;
  }
  const [keyPat, valuePat] = parameter.elements;
  return isIdentifierPattern(keyPat) && isIdentifierPattern(valuePat)
    ? { keyName: keyPat.name, valueName: valuePat.name }
    : null;
};

export type EntriesMapPattern = {
  readonly callback:
    TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;
  readonly fullCall: TSESTree.CallExpression;
  readonly objExpr: TSESTree.Expression;
};

// Check if callback is a function expression type
const isValidCallback = (
  callback: TSESTree.Node
): callback is
  TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression => {
  return (
    AST_NODE_TYPES.ArrowFunctionExpression === callback.type ||
    AST_NODE_TYPES.FunctionExpression === callback.type
  );
};

// Shared detection for Object.fromEntries(Object.entries(obj).map(callback))
// Returns the intermediate structure before callback-specific validation
export const detectEntriesMapPattern = (node: TSESTree.Node) => {
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

  // Validate callback is a function expression
  if (!isValidCallback(callback)) {
    return null;
  }

  return {
    callback,
    fullCall: node,
    objExpr: objectArgument
  };
};
