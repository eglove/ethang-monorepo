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
import {
  isSchemaDecodeCall,
  isSchemaDecodeCallee
} from "../utils/schema-decode.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "validateUnknown";
type Options = [];

const isUnknownOrAny = (flags: TypeFlags) => {
  // eslint-disable-next-line no-bitwise -- TypeFlags is a bitfield enum
  return 0 !== (flags & (TypeFlags.Unknown | TypeFlags.Any));
};

const isInsideSchemaDecodeChain = (
  node: TSESTree.Expression,
  ancestors: readonly TSESTree.Node[]
) => {
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

const isResultDiscarded = (ancestors: readonly TSESTree.Node[]) => {
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
) => {
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
) => {
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
