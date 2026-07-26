import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

import { isCallExpression, isIdentifier } from "./type-guards.ts";

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
  /* v8 ignore next 2 -- unreachable: isMapCall already guarantees callee is MemberExpression */
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
