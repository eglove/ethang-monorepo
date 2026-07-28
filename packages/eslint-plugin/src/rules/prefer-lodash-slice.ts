import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import { Option, Schema } from "effect";
import isNil from "lodash/isNil.js";
import isObjectLike from "lodash/isObjectLike.js";

import { ensureLodashImport } from "./../utils/ast.ts";
import { isIdentifier, isMemberExpression } from "./../utils/type-guards.ts";

// Shape of the parser services object as exposed by `@typescript-eslint`.
// Either projectService mode (`getTypeAtLocation` directly) or classic mode
// (`esTreeNodeToTSNodeMap` + `program`). We validate the loosely-typed
// `unknown` services through an Effect Schema before touching any member so
// the result is concrete rather than `unknown` (satisfies `validate-unknown`).
type ParserServices = {
  readonly esTreeNodeToTSNodeMap?: Map<TSESTree.Node, TSESTree.Node>;
  readonly getTypeAtLocation?: (node: TSESTree.Node) => unknown;
  readonly program?: {
    getTypeChecker: () => unknown;
  };
};

const ParserServicesSchema = Schema.declare(
  (input: unknown): input is ParserServices => {
    if (!isObjectLike(input)) {
      return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- narrowing `unknown` to an index-signature record for structural inspection
    const record = input as Record<string, unknown>;
    const hasProjectService = "function" === typeof record["getTypeAtLocation"];
    const hasClassic =
      "object" === typeof record["esTreeNodeToTSNodeMap"] &&
      "object" === typeof record["program"];
    return hasProjectService || hasClassic;
  }
);

// A resolved TypeScript `Type`. We only need `isUnion` and its `types` for the
// string-union branch; the concrete TS `Type` type is intentionally avoided so
// this rule has no hard dependency on the `typescript` compiler types.
type TsType = {
  readonly isUnion: () => boolean;
  readonly types?: readonly unknown[];
};

const TsTypeSchema = Schema.declare((input: unknown): input is TsType => {
  if (!isObjectLike(input)) {
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- narrowing `unknown` to an index-signature record for structural inspection
  const record = input as Record<string, unknown>;
  return "function" === typeof record["isUnion"];
});

// A resolved TypeScript `TypeChecker`, narrowed to the methods we use. In
// projectService mode only `typeToString` is needed; in classic mode
// `getTypeAtLocation` is also required to map the ESTree node back to a TS node.
type TsChecker = {
  readonly getTypeAtLocation?: (node: unknown) => unknown;
  readonly typeToString: (type: unknown) => string;
};

const TsCheckerSchema = Schema.declare((input: unknown): input is TsChecker => {
  if (!isObjectLike(input)) {
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- narrowing `unknown` to an index-signature record for structural inspection
  const record = input as Record<string, unknown>;
  return "function" === typeof record["typeToString"];
});

// Resolve the TypeScript type of a node via the linter's parser services. When
// type information is unavailable (untyped lint run), this returns null and
// callers stay conservative. We intentionally do NOT rewrite string receivers:
// lodash `slice`/`take` coerce a string to `string[]`, which is wrong for
// `String.prototype.slice`. Only array-typed receivers are safe to rewrite.
export const getNodeType = (
  node: TSESTree.Node,
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>
) => {
  const servicesOption = Schema.decodeUnknownOption(ParserServicesSchema)(
    context.sourceCode.parserServices
  );
  const services = Option.getOrNull(servicesOption);
  if (isNil(services)) {
    return null;
  }
  // Classic mode (`esTreeNodeToTSNodeMap` + `program`) is tried first; if it
  // yields nothing and projectService mode (`getTypeAtLocation` directly) is
  // available, resolve through that path instead.
  if (!isNil(services.program)) {
    const classic = resolveClassicType(services, services.program, node);
    if (!isNil(classic)) {
      return classic;
    }
  }
  if ("function" === typeof services.getTypeAtLocation) {
    const typeOption = Schema.decodeUnknownOption(TsTypeSchema)(
      services.getTypeAtLocation(node)
    );
    const type = Option.getOrNull(typeOption);
    if (isNil(type)) {
      return null;
    }
    const { program } = services;
    if (isNil(program)) {
      return { checker: { typeToString: String }, type };
    }
    const checkerOption = Schema.decodeUnknownOption(TsCheckerSchema)(
      program.getTypeChecker()
    );
    const checker = Option.getOrNull(checkerOption);
    if (isNil(checker)) {
      return { checker: { typeToString: String }, type };
    }
    return { checker, type };
  }
  return null;
};

// Classic mode resolves the type via `esTreeNodeToTSNodeMap` + `program`.
const resolveClassicType = (
  services: ParserServices,
  program: { getTypeChecker: () => unknown },
  node: TSESTree.Node
) => {
  const map = services.esTreeNodeToTSNodeMap;
  const tsNode = isNil(map) ? null : map.get(node);
  const { getTypeChecker } = program;
  const checkerOption =
    Schema.decodeUnknownOption(TsCheckerSchema)(getTypeChecker());
  const checker = Option.getOrNull(checkerOption);
  if (isNil(checker)) {
    return null;
  }
  const { getTypeAtLocation } = checker;
  if (isNil(getTypeAtLocation)) {
    return null;
  }
  const target = isNil(tsNode) ? node : tsNode;
  const typeOption = Schema.decodeUnknownOption(TsTypeSchema)(
    getTypeAtLocation(target)
  );
  const type = Option.getOrNull(typeOption);
  if (isNil(type)) {
    return null;
  }
  return { checker, type };
};

// A type is treated as a string when its rendered form is `string`, a string
// literal (`"..."`), a template literal, or a union/template containing one.
export const isStringText = (text: string) => {
  return (
    "string" === text ||
    text.startsWith('"') ||
    text.startsWith("'") ||
    text.startsWith("`")
  );
};

export const isStringType = (
  node: TSESTree.Node,
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>
) => {
  const resolved = getNodeType(node, context);
  if (isNil(resolved)) {
    return false;
  }
  const { checker, type } = resolved;
  if (type.isUnion()) {
    return (type.types ?? []).some((member) => {
      return isStringText(checker.typeToString(member));
    });
  }
  return isStringText(checker.typeToString(type));
};

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferLodashSlice";

type Options = [];

const SLICE = "slice";

// `arr.slice(...)` is the only native shape this rule rewrites. The receiver
// must be a plain identifier (`arr`, not `get().slice` or `a.b.slice`) and
// the member must be non-computed (reject `arr["slice"]`). `slice` is in
// `NATIVE_EQUIVALENT_METHODS`, so the umbrella `prefer-lodash` rule skips it
// entirely — this dedicated rule is the sole reporter for the shape.
//
// We rewrite to lodash `slice(arr, start, end)` rather than `take`/`takeRight`
// because `_.take`/`_.takeRight` coerce their input to an array and are thus
// WRONG for strings: `take("abc", 2)` yields `["a","b"]`, not `"ab"`. lodash
// `slice` is the faithful array equivalent of `Array.prototype.slice` and is
// the safe default; string receivers should use a string-aware helper (e.g.
// `split`) and are out of scope here.
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
  // A non-computed member expression always has an `Identifier` property, so
  // this branch is unreachable for any legal input.

  if (!isIdentifier(property)) {
    return false;
  }
  return "slice" === property.name;
};

export type SliceArguments = {
  readonly end: null | TSESTree.Expression;
  readonly start: null | TSESTree.Expression;
};

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

export type SliceShape = {
  readonly endNode: null | TSESTree.Expression;
  readonly startNode: TSESTree.Expression;
};

// Classify the slice call into a lodash `slice(arr, start, end)` shape, or
// null when the call is not a pure prefix/suffix slice (drop, mid-slice,
// positive start, no args, extra args, non-literal/identifier args). The
// returned nodes become the start/end arguments of the lodash call.
export const classifySliceShape = (node: TSESTree.CallExpression) => {
  const { arguments: _arguments } = node;
  if (1 !== _arguments.length && 2 !== _arguments.length) {
    return null;
  }
  const { end, start } = getSliceArguments(node);

  // `slice(0, n)` → slice(arr, 0, n)
  if (start && end && isZeroLiteral(start)) {
    const shape: SliceShape = { endNode: end, startNode: start };
    return shape;
  }

  // `slice(-n)` → slice(arr, -n)
  if (start && !end) {
    const count = getNegativeCountText(start);
    if (!isNil(count)) {
      const shape: SliceShape = { endNode: null, startNode: start };
      return shape;
    }
  }

  return null;
};

export type SliceMatch = {
  readonly endNode: null | TSESTree.Expression;
  readonly receiver: TSESTree.Identifier;
  readonly startNode: TSESTree.Expression;
};

export const detectSlicePattern = (node: TSESTree.Node) => {
  if (!isSliceCall(node)) {
    return null;
  }
  const shape = classifySliceShape(node);
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
    endNode: shape.endNode,
    receiver: object,
    startNode: shape.startNode
  };
};

const getNodeText = (node: TSESTree.Expression, sourceText: string) => {
  return sourceText.slice(node.range[0], node.range[1]);
};

export const formatSliceCall = (
  receiverText: string,
  startText: string,
  endText: string
) => {
  return `${SLICE}(${receiverText}, ${startText}${
    "" === endText ? "" : `, ${endText}`
  })`;
};

const buildSliceFix = (
  fixer: TSESLint.RuleFixer,
  node: TSESTree.CallExpression,
  match: SliceMatch,
  program: TSESTree.Program,
  sourceText: string
) => {
  const receiverText = getNodeText(match.receiver, sourceText);
  const startText = getNodeText(match.startNode, sourceText);
  const endText = isNil(match.endNode)
    ? ""
    : getNodeText(match.endNode, sourceText);
  const replacement = formatSliceCall(receiverText, startText, endText);
  const replace = fixer.replaceText(node, replacement);
  const importFix = ensureLodashImport(program, SLICE, fixer);
  return importFix ? [replace, importFix] : replace;
};

const isExpression = (node: TSESTree.Node): node is TSESTree.Expression => {
  return (
    AST_NODE_TYPES.PrivateIdentifier !== node.type &&
    AST_NODE_TYPES.SpreadElement !== node.type
  );
};

export const preferLodashSliceRule = createRule<Options, MessageIds>({
  create(context) {
    const { sourceCode } = context;
    const sourceText = sourceCode.text;
    const program = sourceCode.ast;

    const listener: TSESLint.RuleListener = {
      CallExpression: (node) => {
        const match = detectSlicePattern(node);
        if (!match) {
          return;
        }
        // Never rewrite string receivers: lodash `slice` would coerce the
        // string to `string[]`. Native `String.prototype.slice` is correct.
        if (isStringType(match.receiver, context)) {
          return;
        }
        context.report({
          fix: (fixer) => {
            return buildSliceFix(fixer, node, match, program, sourceText);
          },
          messageId: "preferLodashSlice",
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
        "Prefer `_.slice` over the native `slice` prefix/suffix idiom."
    },
    fixable: "code",
    messages: {
      preferLodashSlice:
        "Prefer `slice(arr, 0, n)` / `slice(arr, -n)` over `arr.slice(0, n)` / `arr.slice(-n)`. Lodash `slice` is the faithful array equivalent."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-lodash-slice"
});
