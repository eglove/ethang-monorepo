import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";

// Schema decode-style methods. A call to one of these is treated as the
// validation boundary: any unknown/any expression passed to it (either as a
// direct argument or as the argument of the curried form) is considered
// validated.
export const SCHEMA_DECODE_METHODS = new Set([
  "decode",
  "decodeEither",
  "decodeExit",
  "decodeOption",
  "decodePromise",
  "decodeSync",
  "decodeUnknown",
  "decodeUnknownEither",
  "decodeUnknownExit",
  "decodeUnknownOption",
  "decodeUnknownPromise",
  "decodeUnknownSync",
  "is",
  "validate",
  "validateEither",
  "validateExit",
  "validateOption",
  "validatePromise",
  "validateSync"
]);

export const DECODE_ALIASES = new Set(["S", "Schema", "Schema$"]);

const STRING_LITERAL_TYPE = AST_NODE_TYPES.Literal;
const TEMPLATE_LITERAL_TYPE = AST_NODE_TYPES.TemplateLiteral;
const IDENTIFIER_TYPE = AST_NODE_TYPES.Identifier;

const cookedValue = (templateLiteral: TSESTree.TemplateLiteral) => {
  const [first] = templateLiteral.quasis;

  if (isNil(first)) {
    return null;
  }
  return first.value.cooked;
};

const getStringLiteralValue = (node: TSESTree.Node) => {
  if (STRING_LITERAL_TYPE !== node.type) {
    return null;
  }
  return "string" === typeof node.value ? node.value : null;
};

const getStaticTemplateLiteralValue = (node: TSESTree.Node) => {
  if (TEMPLATE_LITERAL_TYPE !== node.type) {
    return null;
  }
  if (0 !== node.expressions.length) {
    return null;
  }
  return cookedValue(node);
};

const getComputedPropertyName = (property: TSESTree.Node) => {
  return (
    getStringLiteralValue(property) ?? getStaticTemplateLiteralValue(property)
  );
};

const getNonComputedPropertyName = (property: TSESTree.Node) => {
  return IDENTIFIER_TYPE === property.type ? property.name : null;
};

export const getMemberExpressionPropertyName = (
  callee: TSESTree.MemberExpression
) => {
  if (callee.computed) {
    return getComputedPropertyName(callee.property);
  }
  return getNonComputedPropertyName(callee.property);
};

export const isSchemaAliasReceiver = (
  node: TSESTree.Node
): node is {
  object: TSESTree.Identifier;
} & TSESTree.MemberExpression => {
  if (AST_NODE_TYPES.MemberExpression !== node.type) {
    return false;
  }
  if (IDENTIFIER_TYPE !== node.object.type) {
    return false;
  }
  return DECODE_ALIASES.has(node.object.name);
};

export const isSchemaDecodeCall = (node: TSESTree.CallExpression) => {
  if (!isSchemaAliasReceiver(node.callee)) {
    return false;
  }
  const propertyName = getMemberExpressionPropertyName(node.callee);
  if (isNil(propertyName)) {
    return false;
  }
  return SCHEMA_DECODE_METHODS.has(propertyName);
};

export const isSchemaDecodeCallee = (node: TSESTree.Node) => {
  // Curried form: Schema.decode*(args)(value) — the outer call's callee is
  // itself a Schema decode call.
  return (
    AST_NODE_TYPES.CallExpression === node.type && isSchemaDecodeCall(node)
  );
};
