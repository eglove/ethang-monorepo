import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

export const isExpression = (
  node: TSESTree.Expression | TSESTree.PrivateIdentifier
) => {
  return node.type !== AST_NODE_TYPES.PrivateIdentifier;
};

export const isIdentifier = (
  node: TSESTree.Node
): node is TSESTree.Identifier => {
  return AST_NODE_TYPES.Identifier === node.type;
};

export const isCallExpression = (
  node: TSESTree.Node
): node is TSESTree.CallExpression => {
  return AST_NODE_TYPES.CallExpression === node.type;
};

export const isMemberExpression = (
  node: TSESTree.Node
): node is TSESTree.MemberExpression => {
  return AST_NODE_TYPES.MemberExpression === node.type;
};

export const isFunctionExpression = (
  node: TSESTree.Node
): node is TSESTree.FunctionExpression => {
  return AST_NODE_TYPES.FunctionExpression === node.type;
};

export const isArrowFunctionExpression = (
  node: TSESTree.Node
): node is TSESTree.ArrowFunctionExpression => {
  return AST_NODE_TYPES.ArrowFunctionExpression === node.type;
};

export const isBlockStatement = (
  node: TSESTree.Node
): node is TSESTree.BlockStatement => {
  return AST_NODE_TYPES.BlockStatement === node.type;
};

export const isReturnStatement = (
  node: TSESTree.Node
): node is TSESTree.ReturnStatement => {
  return AST_NODE_TYPES.ReturnStatement === node.type;
};

export const isThisExpression = (
  node: TSESTree.Node
): node is TSESTree.ThisExpression => {
  return AST_NODE_TYPES.ThisExpression === node.type;
};

export const isExpressionStatement = (
  node: TSESTree.Node
): node is TSESTree.ExpressionStatement => {
  return AST_NODE_TYPES.ExpressionStatement === node.type;
};

export const isLiteral = (node: TSESTree.Node): node is TSESTree.Literal => {
  return AST_NODE_TYPES.Literal === node.type;
};

export const isTemplateLiteral = (
  node: TSESTree.Node
): node is TSESTree.TemplateLiteral => {
  return AST_NODE_TYPES.TemplateLiteral === node.type;
};

export const isArrayExpression = (
  node: TSESTree.Node
): node is TSESTree.ArrayExpression => {
  return AST_NODE_TYPES.ArrayExpression === node.type;
};

export const isSpreadElement = (
  node: TSESTree.Node
): node is TSESTree.SpreadElement => {
  return AST_NODE_TYPES.SpreadElement === node.type;
};

export const isNewExpression = (
  node: TSESTree.Node
): node is TSESTree.NewExpression => {
  return AST_NODE_TYPES.NewExpression === node.type;
};

export const isBinaryExpression = (
  node: TSESTree.Node
): node is TSESTree.BinaryExpression => {
  return AST_NODE_TYPES.BinaryExpression === node.type;
};

export const isUnaryExpression = (
  node: TSESTree.Node
): node is TSESTree.UnaryExpression => {
  return AST_NODE_TYPES.UnaryExpression === node.type;
};
