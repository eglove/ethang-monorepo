import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";

import {
  isCallExpression,
  isIdentifier,
  isMemberExpression
} from "./../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferEffectEncodingBase64";

type Options = [];

const BUFFER = "Buffer";
const FROM = "from";
const TO_STRING = "toString";
const BASE64 = "base64";
const UTF8 = "utf8";

export type EncodingMatch = {
  readonly arg: TSESTree.Expression;
  readonly kind: "decode" | "encode";
};

// True when `node` is a string `Literal` whose value equals `value`.
const isLiteralWithValue = (node: null | TSESTree.Node, value: string) => {
  return (
    !isNil(node) && AST_NODE_TYPES.Literal === node.type && value === node.value
  );
};

// `Buffer.from(...)` on the global `Buffer` identifier (non-computed).
export const getBufferFromArguments = (node: TSESTree.Node) => {
  if (!isCallExpression(node)) {
    return null;
  }
  const { callee } = node;
  if (!isMemberExpression(callee) || callee.computed) {
    return null;
  }
  if (!isIdentifier(callee.object) || BUFFER !== callee.object.name) {
    return null;
  }
  /* v8 ignore next 3 */
  if (!isIdentifier(callee.property) || FROM !== callee.property.name) {
    // This branch is unreachable: when computed=false, property MUST be an Identifier
    return null;
  }
  return node.arguments;
};

// Exported for testing: isBase64ToStringCall
export const isBase64ToStringCall = (
  node: TSESTree.Node
): node is TSESTree.CallExpression => {
  /* v8 ignore next 4 */
  if (!isCallExpression(node)) {
    // This branch is unreachable: callers only pass CallExpression nodes
    return false;
  }
  const { callee } = node;
  if (!isMemberExpression(callee) || callee.computed) {
    return false;
  }
  /* v8 ignore next 3 */
  if (!isIdentifier(callee.property) || TO_STRING !== callee.property.name) {
    // This branch is unreachable: when computed=false, property MUST be an Identifier
    return false;
  }
  return isLiteralWithValue(node.arguments[0] ?? null, BASE64);
};

// Exported for testing: getFirstBufferFromArgument
export const getFirstBufferFromArgument = (
  argumentList: readonly TSESTree.CallExpressionArgument[]
) => {
  if (1 !== argumentList.length) {
    return null;
  }
  const [argument] = argumentList;
  if (!argument || AST_NODE_TYPES.SpreadElement === argument.type) {
    return null;
  }
  return argument;
};

// Exported for testing: getBase64BufferFromDataArgument
export const getBase64BufferFromDataArgument = (
  argumentList: null | readonly TSESTree.CallExpressionArgument[]
) => {
  if (isNil(argumentList) || 2 !== argumentList.length) {
    return null;
  }
  const [input, innerEncoding] = argumentList;
  if (!input || AST_NODE_TYPES.SpreadElement === input.type) {
    return null;
  }
  if (!innerEncoding || !isLiteralWithValue(innerEncoding, BASE64)) {
    return null;
  }
  return input;
};

// `Buffer.from(x).toString("base64")` -> { kind: "encode", arg: x }
export const detectEncodeBase64Pattern = (node: TSESTree.Node) => {
  if (!isBase64ToStringCall(node)) {
    return null;
  }
  const { callee } = node;
  if (!isMemberExpression(callee)) {
    return null;
  }
  const bufferObject = callee.object;
  const bufferArguments = getBufferFromArguments(bufferObject);
  const input = isNil(bufferArguments)
    ? null
    : getFirstBufferFromArgument(bufferArguments);
  if (isNil(input)) {
    return null;
  }
  const match: EncodingMatch = { arg: input, kind: "encode" };
  return match;
};

// `Buffer.from(x, "base64").toString()` / `.toString("utf8")`
// -> { kind: "decode", arg: x }
export const detectDecodeBase64Pattern = (node: TSESTree.Node) => {
  if (!isCallExpression(node)) {
    return null;
  }
  const { callee } = node;
  if (!isMemberExpression(callee) || callee.computed) {
    return null;
  }
  /* v8 ignore next 3 */
  if (!isIdentifier(callee.property) || TO_STRING !== callee.property.name) {
    // This branch is unreachable: when computed=false, property MUST be an Identifier
    return null;
  }
  const [encodingArgument] = node.arguments;
  if (!isNil(encodingArgument) && !isLiteralWithValue(encodingArgument, UTF8)) {
    return null;
  }
  const bufferArguments = getBufferFromArguments(callee.object);
  const input = getBase64BufferFromDataArgument(bufferArguments);
  if (isNil(input)) {
    return null;
  }
  const match: EncodingMatch = { arg: input, kind: "decode" };
  return match;
};

export const detectEncodingBase64Pattern = (node: TSESTree.Node) => {
  return detectEncodeBase64Pattern(node) ?? detectDecodeBase64Pattern(node);
};

const formatEncodingCall = (
  kind: "decode" | "encode",
  argumentText: string
) => {
  return "encode" === kind
    ? `Encoding.encodeBase64(${argumentText})`
    : `Encoding.decodeBase64(${argumentText})`;
};

const buildEncodingFix = (
  sourceCode: TSESLint.SourceCode,
  fixer: TSESLint.RuleFixer,
  node: TSESTree.CallExpression,
  match: EncodingMatch
) => {
  const argumentText = sourceCode.getText(match.arg);
  return fixer.replaceText(node, formatEncodingCall(match.kind, argumentText));
};

export const preferEffectEncodingBase64Rule = createRule<Options, MessageIds>({
  create(context) {
    const { sourceCode } = context;
    return {
      CallExpression: (node) => {
        const match = detectEncodingBase64Pattern(node);
        if (isNil(match)) {
          return;
        }
        context.report({
          fix: (fixer) => {
            return buildEncodingFix(sourceCode, fixer, node, match);
          },
          messageId: "preferEffectEncodingBase64",
          node
        });
      }
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Prefer `Encoding.encodeBase64` / `Encoding.decodeBase64` over `Buffer`-based base64 idioms."
    },
    fixable: "code",
    messages: {
      preferEffectEncodingBase64:
        'Prefer `Encoding.encodeBase64` / `Encoding.decodeBase64` (from `effect`) over `Buffer.from(...).toString("base64")`. Add `import { Encoding } from "effect";` after applying the fix.'
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-effect-encoding-base64"
});
