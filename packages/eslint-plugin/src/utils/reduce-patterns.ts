import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

import { isIdentifier, isMemberExpression } from "./type-guards.ts";

// --- Shared types ---

export type ReduceCallback =
  TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;

export type ReduceCallbackInfo = {
  readonly accumulatorName: string;
  readonly block: TSESTree.BlockStatement;
  readonly itemName: string;
};

export type ReduceCallInfo = {
  readonly arr: TSESTree.Expression;
};

// --- Shared helpers for reduce-based pattern detection ---

export const isReduceCallback = (
  node: TSESTree.Node
): node is ReduceCallback => {
  if (AST_NODE_TYPES.ArrowFunctionExpression === node.type) {
    return true;
  }

  if (AST_NODE_TYPES.FunctionExpression === node.type) {
    return true;
  }
  return false;
};

export function isReduceCall(
  callee: TSESTree.Node
): callee is { property: TSESTree.Identifier } & TSESTree.MemberExpression {
  if (!isMemberExpression(callee)) {
    return false;
  }

  if (callee.computed) {
    return false;
  }

  if ("reduce" !== callee.property.name) {
    return false;
  }
  return true;
}

export const isEmptyObject = (node: TSESTree.Node) => {
  if (AST_NODE_TYPES.ObjectExpression !== node.type) {
    return false;
  }
  return 0 === node.properties.length;
};

export function hasTwoIdentifierParameters(
  callback: ReduceCallback
): callback is {
  params: [TSESTree.Identifier, TSESTree.Identifier];
} & ReduceCallback {
  if (2 > callback.params.length) {
    return false;
  }
  const [first, second] = callback.params;

  if (!first || !second) {
    return false;
  }
  return isIdentifier(first) && isIdentifier(second);
}

export const returnsAccumulator = (
  block: TSESTree.BlockStatement,
  accumulatorName: string
) => {
  const last = block.body.at(-1);

  if (AST_NODE_TYPES.ReturnStatement !== last?.type) {
    return false;
  }

  if (!last.argument || !isIdentifier(last.argument)) {
    return false;
  }
  return accumulatorName === last.argument.name;
};

export function isMemberAccumulator(
  node: TSESTree.Node,
  accumulatorName: string
): node is TSESTree.MemberExpression {
  if (!isMemberExpression(node)) {
    return false;
  }

  if (!node.computed) {
    return false;
  }

  if (!isIdentifier(node.object)) {
    return false;
  }
  return accumulatorName === node.object.name;
}

export const isItemProperty = (node: TSESTree.Node, itemName: string) => {
  if (!isMemberExpression(node)) {
    return false;
  }

  if (!isIdentifier(node.object)) {
    return false;
  }

  if (itemName !== node.object.name) {
    return false;
  }

  if (!isIdentifier(node.property)) {
    return false;
  }
  return true;
};

export const extractKeyFromMember = (
  member: TSESTree.MemberExpression,
  itemName: string
) => {
  if (!isItemProperty(member.property, itemName)) {
    return null;
  }

  if (AST_NODE_TYPES.MemberExpression !== member.property.type) {
    return null;
  }
  const { property } = member.property;

  if (!isIdentifier(property)) {
    return null;
  }
  return property.name;
};

export function validateCallbackStructure(callback: TSESTree.Node) {
  if (!isReduceCallback(callback)) {
    return null;
  }
  if (!hasTwoIdentifierParameters(callback)) {
    return null;
  }
  const [first, second] = callback.params;
  const { name: accumulatorName } = first;
  const { name: itemName } = second;
  if (AST_NODE_TYPES.BlockStatement !== callback.body.type) {
    return null;
  }
  return { accumulatorName, block: callback.body, itemName };
}

export function validateReduceCallStructure(call: TSESTree.CallExpression) {
  if (!isReduceCall(call.callee)) {
    return null;
  }
  const [, defaultArgument] = call.arguments;
  if (!defaultArgument || !isEmptyObject(defaultArgument)) {
    return null;
  }
  return { arr: call.callee.object };
}

export const validateBlockStructure = (
  block: TSESTree.BlockStatement,
  accumulatorName: string
) => {
  if (!returnsAccumulator(block, accumulatorName)) {
    return null;
  }
  const [firstStatement] = block.body;

  if (AST_NODE_TYPES.ExpressionStatement !== firstStatement?.type) {
    return null;
  }
  return firstStatement;
};
