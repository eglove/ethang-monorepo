import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import {
  type Signature,
  type Type,
  type TypeChecker,
  TypeFlags
} from "typescript";

import { getParserServices } from "../utils/ast.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "validateUnknown";
type Options = [];

// Schema decode-style methods. A call to one of these is treated as the
// validation boundary: any unknown/any expression passed to it (either as a
// direct argument or as the argument of the curried form) is considered
// validated.
const SCHEMA_DECODE_METHODS = new Set([
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

const DECODE_ALIASES = new Set(["S", "Schema", "Schema$"]);

const isSchemaDecodeCall = (node: TSESTree.CallExpression): boolean => {
  const { callee } = node;
  if (AST_NODE_TYPES.MemberExpression !== callee.type) {
    return false;
  }
  if (AST_NODE_TYPES.Identifier !== callee.object.type) {
    return false;
  }
  if (!DECODE_ALIASES.has(callee.object.name)) {
    return false;
  }
  if (AST_NODE_TYPES.Identifier !== callee.property.type || callee.computed) {
    return false;
  }
  return SCHEMA_DECODE_METHODS.has(callee.property.name);
};

const isSchemaDecodeCallee = (node: TSESTree.Node): boolean => {
  // Curried form: Schema.decode*(args)(value) — the outer call's callee is
  // itself a Schema decode call.
  return (
    AST_NODE_TYPES.CallExpression === node.type && isSchemaDecodeCall(node)
  );
};

const isUnknownOrAny = (flags: TypeFlags): boolean => {
  // eslint-disable-next-line no-bitwise -- TypeFlags is a bitfield enum
  return 0 !== (flags & (TypeFlags.Unknown | TypeFlags.Any));
};

const isInsideSchemaDecodeChain = (
  node: TSESTree.Expression,
  ancestors: readonly TSESTree.Node[]
): boolean => {
  // Walk up the ancestor chain. The unknown/any result is validated if any
  // ancestor is a curried Schema decode call where the current node is one
  // of its arguments. This handles `Schema.decode*(Schema)(value)`. The
  // direct form (`Schema.decode*(value)`) is short-circuited in the
  // CallExpression listener before we ever walk ancestors here.
  return ancestors.some((ancestor) => {
    if (AST_NODE_TYPES.CallExpression !== ancestor.type) {
      return false;
    }
    if (!ancestor.arguments.includes(node)) {
      return false;
    }
    return isSchemaDecodeCallee(ancestor.callee);
  });
};

const isResultDiscarded = (ancestors: readonly TSESTree.Node[]): boolean => {
  const directParent = ancestors.at(-1);
  // `void F();` — wrapped unary void discards the result.
  if (
    AST_NODE_TYPES.UnaryExpression === directParent?.type &&
    "void" === directParent.operator &&
    AST_NODE_TYPES.ExpressionStatement === ancestors.at(-2)?.type
  ) {
    return true;
  }
  // Bare `F();` — ExpressionStatement at the top level discards the result.
  return AST_NODE_TYPES.ExpressionStatement === directParent?.type;
};

const getReturnTypeFlags = (
  checker: TypeChecker,
  services: ReturnType<typeof getParserServices>,
  node: TSESTree.CallExpression
): TypeFlags => {
  const tsNode = services.esTreeNodeToTSNodeMap.get(node);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- TS compiler API types are over-defensive; signature is always non-null for a real CallExpression node
  const signature = checker.getResolvedSignature(
    tsNode
  ) as unknown as Signature;
  return signature.getReturnType().flags;
};

const getAwaitedTypeFlags = (
  checker: TypeChecker,
  services: ReturnType<typeof getParserServices>,
  node: TSESTree.AwaitExpression
): TypeFlags => {
  const tsNode = services.esTreeNodeToTSNodeMap.get(node);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- TS compiler API types are over-defensive; awaited is always non-null for a real AwaitExpression node
  const awaited = checker.getAwaitedType(
    checker.getTypeAtLocation(tsNode)
  ) as unknown as Type;
  return awaited.flags;
};

export const validateUnknownRule = createRule<Options, MessageIds>({
  create(context) {
    const services = getParserServices(context);
    const checker = services.program.getTypeChecker();

    const listener: TSESLint.RuleListener = {
      AwaitExpression(node) {
        const ancestors = context.sourceCode.getAncestors(node);
        if (isResultDiscarded(ancestors)) {
          return;
        }
        if (isInsideSchemaDecodeChain(node, ancestors)) {
          return;
        }
        if (!isUnknownOrAny(getAwaitedTypeFlags(checker, services, node))) {
          return;
        }
        context.report({
          messageId: "validateUnknown",
          node
        });
      },
      CallExpression(node) {
        // Schema decode calls themselves are the validation mechanism; never
        // flag them. This also covers the curried form
        // (`Schema.decode*(args)(value)`) where the outer call's callee is
        // itself a Schema decode call.
        if (isSchemaDecodeCall(node)) {
          return;
        }
        if (isSchemaDecodeCallee(node.callee)) {
          return;
        }
        const ancestors = context.sourceCode.getAncestors(node);
        if (isResultDiscarded(ancestors)) {
          return;
        }
        if (isInsideSchemaDecodeChain(node, ancestors)) {
          return;
        }
        if (!isUnknownOrAny(getReturnTypeFlags(checker, services, node))) {
          return;
        }
        context.report({
          messageId: "validateUnknown",
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
        "Require that results of calls returning `unknown` or `any` are validated by an Effect Schema (`Schema.decodeUnknown*` / `Schema.is` / `Schema.validate*` / `S.decode*` family) before being used downstream."
    },
    messages: {
      validateUnknown:
        "This call returns `unknown`/`any`. Validate the result with an Effect Schema (e.g. `Schema.decodeUnknownSync(MySchema)(value)`) before using it downstream."
    },
    schema: [],
    type: "problem"
  },
  name: "validate-unknown"
});
