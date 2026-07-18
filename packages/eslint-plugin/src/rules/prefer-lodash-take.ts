import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";

import { ensureLodashImport } from "./../utils/ast.ts";
import { isIdentifier, isMemberExpression } from "./../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferLodashTake";

type Options = [];

const TAKE = "take";
const TAKE_RIGHT = "takeRight";

// `arr.slice(...)` is the only native shape this rule rewrites. The receiver
// must be a plain identifier (`arr`, not `get().slice` or `a.b.slice`) and
// the member must be non-computed (reject `arr["slice"]`). `slice` is in
// `NATIVE_EQUIVALENT_METHODS`, so the umbrella `prefer-lodash` rule skips it
// entirely — this dedicated rule is the sole reporter for the shape.
export const isSliceCall = (
  node: TSESTree.Node
): node is TSESTree.CallExpression => {
  if (AST_NODE_TYPES.CallExpression !== node.type) {
    return false;
  }
  const { callee } = node;
  if (!isMemberExpression(callee)) {
    return false;
  }
  if (callee.computed) {
    return false;
  }
  const { object } = callee;
  if (!isIdentifier(object)) {
    return false;
  }
  const { property } = callee;
  if (!isIdentifier(property)) {
    return false;
  }
  return "slice" === property.name;
};

export type TakeArguments = {
  readonly end: null | TSESTree.Expression;
  readonly start: null | TSESTree.Expression;
};

export type TakeKind = "take" | "takeRight";

export const getSliceArguments = (node: TSESTree.CallExpression) => {
  const [start, end] = node.arguments;
  return {
    end: end && isExpression(end) ? end : null,
    start: start && isExpression(start) ? start : null
  };
};

// A negative numeric literal like `-2` parses as a `UnaryExpression` with
// operator `-`. We accept a numeric literal or an identifier as the operand
// and return the positive count text (`2` / `n`). Any other operand (or a
// non-negative value) returns null so the caller leaves the call alone.
export const getNegativeCountText = (node: TSESTree.Node) => {
  if (AST_NODE_TYPES.UnaryExpression !== node.type || "-" !== node.operator) {
    return null;
  }
  const { argument } = node;
  if (AST_NODE_TYPES.Literal === argument.type) {
    if ("number" !== typeof argument.value || 0 >= argument.value) {
      return null;
    }
    return String(argument.value);
  }
  if (isIdentifier(argument)) {
    return argument.name;
  }
  return null;
};

const isZeroLiteral = (node: TSESTree.Node) => {
  return (
    AST_NODE_TYPES.Literal === node.type &&
    "number" === typeof node.value &&
    0 === node.value
  );
};

export type TakeShape = {
  readonly countNode: TSESTree.Expression;
  readonly kind: TakeKind;
};

// Classify the slice call into a take/takeRight shape, or null when the call
// is not a pure prefix/suffix take (drop, mid-slice, positive start, no
// args, extra args, non-literal/identifier args). The returned `countNode`
// becomes the count argument of the lodash call.
export const classifyTakeShape = (node: TSESTree.CallExpression) => {
  const { arguments: _arguments } = node;
  if (1 !== _arguments.length && 2 !== _arguments.length) {
    return null;
  }
  const { end, start } = getSliceArguments(node);

  // `slice(0, n)` → take(arr, n)
  if (start && end && isZeroLiteral(start)) {
    const shape: TakeShape = { countNode: end, kind: TAKE };
    return shape;
  }

  // `slice(-n)` → takeRight(arr, n)
  if (start && !end) {
    const count = getNegativeCountText(start);
    if (!isNil(count)) {
      const shape: TakeShape = { countNode: start, kind: TAKE_RIGHT };
      return shape;
    }
  }

  return null;
};

export type TakeMatch = {
  readonly countNode: TSESTree.Expression;
  readonly kind: TakeKind;
  readonly receiver: TSESTree.Identifier;
};

export const detectTakePattern = (node: TSESTree.Node) => {
  if (!isSliceCall(node)) {
    return null;
  }
  const shape = classifyTakeShape(node);
  if (!shape) {
    return null;
  }
  const { callee } = node;
  // isSliceCall above guarantees a non-computed member-expression callee.
  if (!isMemberExpression(callee)) {
    return null;
  }
  const { object } = callee;
  // isSliceCall above guarantees the receiver is a non-computed identifier.
  if (!isIdentifier(object)) {
    return null;
  }
  return {
    countNode: shape.countNode,
    kind: shape.kind,
    receiver: object
  };
};

const getCountText = (match: TakeMatch, sourceText: string) => {
  if (TAKE_RIGHT === match.kind) {
    const text = getNegativeCountText(match.countNode);
    return text ?? "";
  }
  return sourceText.slice(match.countNode.range[0], match.countNode.range[1]);
};

export const formatTakeCall = (
  kind: TakeKind,
  receiverText: string,
  count: string
) => {
  return `${kind}(${receiverText}, ${count})`;
};

const buildTakeFix = (
  fixer: TSESLint.RuleFixer,
  node: TSESTree.CallExpression,
  match: TakeMatch,
  program: TSESTree.Program,
  sourceText: string
) => {
  const countText = getCountText(match, sourceText);
  const receiverText = sourceText.slice(
    match.receiver.range[0],
    match.receiver.range[1]
  );
  const replacement = formatTakeCall(match.kind, receiverText, countText);
  const replace = fixer.replaceText(node, replacement);
  const importFix = ensureLodashImport(program, match.kind, fixer);
  return importFix ? [replace, importFix] : replace;
};

const isExpression = (node: TSESTree.Node): node is TSESTree.Expression => {
  return (
    AST_NODE_TYPES.PrivateIdentifier !== node.type &&
    AST_NODE_TYPES.SpreadElement !== node.type
  );
};

export const preferLodashTakeRule = createRule<Options, MessageIds>({
  create(context) {
    const { sourceCode } = context;
    const sourceText = sourceCode.text;
    const program = sourceCode.ast;

    const listener: TSESLint.RuleListener = {
      CallExpression: (node) => {
        const match = detectTakePattern(node);
        if (!match) {
          return;
        }
        context.report({
          fix: (fixer) => {
            return buildTakeFix(fixer, node, match, program, sourceText);
          },
          messageId: "preferLodashTake",
          node
        });
      }
    };

    return listener;
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Prefer `_.take` / `_.takeRight` over the native `slice` prefix/suffix idiom."
    },
    fixable: "code",
    messages: {
      preferLodashTake:
        "Prefer `take(arr, n)` / `takeRight(arr, n)` over `arr.slice(0, n)` / `arr.slice(-n)`. Lodash names the intent directly."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-lodash-take"
});
