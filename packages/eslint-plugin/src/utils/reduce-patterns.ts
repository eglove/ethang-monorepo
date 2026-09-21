import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";

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
  return (
    AST_NODE_TYPES.ArrowFunctionExpression === node.type ||
    AST_NODE_TYPES.FunctionExpression === node.type
  );
};

export function isReduceCall(
  callee: TSESTree.Node
): callee is { property: TSESTree.Identifier } & TSESTree.MemberExpression {
  return (
    isMemberExpression(callee) &&
    !callee.computed &&
    "reduce" === callee.property.name
  );
}

export const isEmptyObject = (node: TSESTree.Node) => {
  return (
    AST_NODE_TYPES.ObjectExpression === node.type &&
    0 === node.properties.length
  );
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

  return (
    !isNil(first) &&
    !isNil(second) &&
    isIdentifier(first) &&
    isIdentifier(second)
  );
}

export const returnsAccumulator = (
  block: TSESTree.BlockStatement,
  accumulatorName: string
) => {
  const last = block.body.at(-1);

  return (
    AST_NODE_TYPES.ReturnStatement === last?.type &&
    !isNil(last.argument) &&
    isIdentifier(last.argument) &&
    accumulatorName === last.argument.name
  );
};

export function isMemberAccumulator(
  node: TSESTree.Node,
  accumulatorName: string
): node is TSESTree.MemberExpression {
  return (
    isMemberExpression(node) &&
    node.computed &&
    isIdentifier(node.object) &&
    accumulatorName === node.object.name
  );
}

export const isItemProperty = (node: TSESTree.Node, itemName: string) => {
  return (
    isMemberExpression(node) &&
    isIdentifier(node.object) &&
    itemName === node.object.name &&
    isIdentifier(node.property)
  );
};

export const extractKeyFromMember = (
  member: TSESTree.MemberExpression,
  itemName: string
) => {
  if (
    !isItemProperty(member.property, itemName) ||
    AST_NODE_TYPES.MemberExpression !== member.property.type
  ) {
    return null;
  }
  const { property } = member.property;

  return isIdentifier(property) ? property.name : null;
};

export function validateCallbackStructure(callback: TSESTree.Node) {
  if (!isReduceCallback(callback) || !hasTwoIdentifierParameters(callback)) {
    return null;
  }
  const [first, second] = callback.params;
  const { name: accumulatorName } = first;
  const { name: itemName } = second;
  return AST_NODE_TYPES.BlockStatement === callback.body.type
    ? { accumulatorName, block: callback.body, itemName }
    : null;
}

export function validateReduceCallStructure(call: TSESTree.CallExpression) {
  if (!isReduceCall(call.callee)) {
    return null;
  }
  const [, defaultArgument] = call.arguments;
  return !defaultArgument || !isEmptyObject(defaultArgument)
    ? null
    : { arr: call.callee.object };
}

export const validateBlockStructure = (
  block: TSESTree.BlockStatement,
  accumulatorName: string
) => {
  if (!returnsAccumulator(block, accumulatorName)) {
    return null;
  }
  const [firstStatement] = block.body;

  return AST_NODE_TYPES.ExpressionStatement === firstStatement?.type
    ? firstStatement
    : null;
};
