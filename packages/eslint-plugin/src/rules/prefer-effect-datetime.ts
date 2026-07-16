import type { SourceFile, Symbol as TsSymbol, Type } from "typescript";

import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import includes from "lodash/includes.js";
import isNil from "lodash/isNil.js";

import { getParserServices } from "./../utils/ast.ts";
import {
  effectDateTimeApi,
  isEffectDateTimeApiKey
} from "./../utils/effect-api.ts";
import { isIdentifier, isMemberExpression } from "./../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds =
  | "preferDateInstanceof"
  | "preferDateMember"
  | "preferDateStatic"
  | "preferDateType"
  | "preferNewDate"
  | "preferTemporal";

type Options = [];

const DATE_STATIC_METHODS = ["now", "parse", "UTC"] as const;

type DateStaticMethod = (typeof DATE_STATIC_METHODS)[number];

const isDateStaticMethod = (name: string): name is DateStaticMethod => {
  return includes(DATE_STATIC_METHODS, name);
};

const formatTarget = (importName: string, name: string) => {
  return `${importName}.${name}`;
};

const isDateIdentifier = (node: TSESTree.Identifier) => {
  return "Date" === node.name;
};

const isTemporalIdentifier = (node: TSESTree.Identifier) => {
  return "Temporal" === node.name;
};

const getSymbolForNode = (
  services: ReturnType<typeof getParserServices>,
  node: TSESTree.Identifier
) => {
  const tsNode = services.esTreeNodeToTSNodeMap.get(node);
  /* v8 ignore next -- `getParserServices` types `program` as `Program | null` but throws when it is null (per its default `allowWithoutFullTypeInformation: false` contract), so this defensive branch is unreachable. */
  if (!services.program) {
    return null;
  }
  return services.program.getTypeChecker().getSymbolAtLocation(tsNode);
};

const isGlobalDeclarationSourceFile = (sourceFile: SourceFile) => {
  return sourceFile.isDeclarationFile;
};

const getFirstDeclaration = (symbol: TsSymbol) => {
  const declarations = symbol.getDeclarations();
  /* v8 ignore next -- `Symbol.getDeclarations()` returns `undefined` only for symbols whose `flags & CheckTypeAlias` etc. resolve to invalid (e.g. synthetic alias-only symbols); the resolved `Date` / `Temporal` / user-defined class symbols we pass in always carry at least one declaration. */
  if (isNil(declarations) || 0 === declarations.length) {
    return null;
  }
  /* v8 ignore next 2 -- the previous guard guarantees `declarations` is non-empty, so `declarations[0]` is always defined. */
  return declarations[0] ?? null;
};

const resolveSymbolOrigin = (
  services: ReturnType<typeof getParserServices>,
  node: TSESTree.Identifier
) => {
  const symbol = getSymbolForNode(services, node);
  /* v8 ignore next -- `getSymbolAtLocation` returns `undefined` only for synthetic / unmapped nodes that typescript-eslint never emits for the positions we resolve: callee identifiers of `NewExpression` / `CallExpression`, the `object` of a `MemberExpression`, and the right-hand side of an `instanceof` `BinaryExpression`. */
  if (isNil(symbol)) {
    return "unknown";
  }
  const firstDeclaration = getFirstDeclaration(symbol);
  /* v8 ignore next -- `getDeclarations()` is never empty for a non-null symbol, so `getFirstDeclaration` never returns `null` here. */
  if (isNil(firstDeclaration)) {
    return "global";
  }
  const sourceFile = firstDeclaration.getSourceFile();
  return isGlobalDeclarationSourceFile(sourceFile) ? "global" : "local";
};

const isGlobalOriginIdentifier = (
  services: ReturnType<typeof getParserServices>,
  node: TSESTree.Identifier
) => {
  const origin = resolveSymbolOrigin(services, node);
  /* v8 ignore next -- `resolveSymbolOrigin` only returns `"unknown"` from the unreachable `v8 ignore`'d branch above. */
  if ("unknown" === origin) {
    return true;
  }
  return "global" === origin;
};

const isGlobalDateIdentifier = (
  services: ReturnType<typeof getParserServices>,
  node: TSESTree.Identifier,
  isDateShadowsGlobal: (
    identifier: TSESTree.Identifier
  ) => boolean = isDateIdentifier
) => {
  /* v8 ignore next -- every caller of `isGlobalDateIdentifier` / `isGlobalTemporalIdentifier` pre-filters the identifier by name (`isDateIdentifier` / `isTemporalIdentifier`) before reaching this helper, so this `false` branch is unreachable. */
  if (!isDateShadowsGlobal(node)) {
    return false;
  }
  return isGlobalOriginIdentifier(services, node);
};

const isGlobalTemporalIdentifier = (
  services: ReturnType<typeof getParserServices>,
  node: TSESTree.Identifier
) => {
  return isGlobalDateIdentifier(services, node, isTemporalIdentifier);
};

const checkNewDateExpression = (
  context: TSESLint.RuleContext<MessageIds, Options>,
  services: ReturnType<typeof getParserServices>,
  node: TSESTree.NewExpression
) => {
  if (!isIdentifier(node.callee)) {
    return;
  }
  if (!isDateIdentifier(node.callee)) {
    return;
  }
  if (!isGlobalDateIdentifier(services, node.callee)) {
    return;
  }
  context.report({
    data: { target: formatTarget("DateTime", "make") },
    messageId: "preferNewDate",
    node
  });
};

const staticMethodTarget = (propertyName: DateStaticMethod) => {
  if ("now" === propertyName) {
    return formatTarget("DateTime", "now");
  }
  if ("parse" === propertyName) {
    return formatTarget("DateTime", "make");
  }
  return formatTarget("DateTime", "unsafeMakeZoned");
};

const checkDateCallExpression = (
  context: TSESLint.RuleContext<MessageIds, Options>,
  services: ReturnType<typeof getParserServices>,
  node: TSESTree.CallExpression
) => {
  const { callee } = node;

  // `Date(...)` (no `new`) is treated as a constructor call as well.
  if (isIdentifier(callee)) {
    if (!isDateIdentifier(callee)) {
      return;
    }
    if (!isGlobalDateIdentifier(services, callee)) {
      return;
    }
    context.report({
      data: { target: formatTarget("DateTime", "make") },
      messageId: "preferDateStatic",
      node
    });
    return;
  }

  // `Date.now()` / `Date.parse(...)` / `Date.UTC(...)`.
  if (!isMemberExpression(callee)) {
    return;
  }
  if (!isIdentifier(callee.object) || !isDateIdentifier(callee.object)) {
    return;
  }
  if (!isGlobalDateIdentifier(services, callee.object)) {
    return;
  }
  if (!isIdentifier(callee.property)) {
    return;
  }

  const propertyName = callee.property.name;
  if (!isDateStaticMethod(propertyName)) {
    return;
  }

  context.report({
    data: { target: staticMethodTarget(propertyName) },
    messageId: "preferDateStatic",
    node
  });
};

const temporalMemberTarget = (propertyName: string) => {
  const key = `Temporal${propertyName}`;
  if (isEffectDateTimeApiKey(key)) {
    const entry = effectDateTimeApi[key];
    return formatTarget(entry.import, entry.name);
  }
  return formatTarget("DateTime", "make");
};

const checkTemporalMemberExpression = (
  context: TSESLint.RuleContext<MessageIds, Options>,
  services: ReturnType<typeof getParserServices>,
  node: TSESTree.MemberExpression
) => {
  if (!isIdentifier(node.object) || !isTemporalIdentifier(node.object)) {
    return;
  }
  if (!isGlobalTemporalIdentifier(services, node.object)) {
    return;
  }
  if (!isIdentifier(node.property)) {
    return;
  }
  context.report({
    data: { target: temporalMemberTarget(node.property.name) },
    messageId: "preferTemporal",
    node
  });
};

const checkBinaryExpression = (
  context: TSESLint.RuleContext<MessageIds, Options>,
  services: ReturnType<typeof getParserServices>,
  node: TSESTree.BinaryExpression
) => {
  if ("instanceof" !== node.operator) {
    return;
  }
  if (
    isIdentifier(node.right) &&
    isDateIdentifier(node.right) &&
    isGlobalDateIdentifier(services, node.right)
  ) {
    context.report({
      data: { target: formatTarget("Predicate", "isDate") },
      messageId: "preferDateInstanceof",
      node
    });
  }
  // `Date` cannot meaningfully appear on the *left* of `instanceof` (the
  // operator is right-associative), so the check above is exhaustive for the
  // operators this rule cares about.
};

const isIdentifierNode = (node: TSESTree.Node): node is TSESTree.Identifier => {
  return AST_NODE_TYPES.Identifier === node.type;
};
const isQualifiedNameDate = (
  left: TSESTree.TSQualifiedName["left"],
  right: TSESTree.TSQualifiedName["right"]
) => {
  if ("Date" !== right.name) {
    return false;
  }
  if (!isIdentifierNode(left)) {
    return false;
  }
  return "Temporal" !== left.name;
};

const isDateTypeReference = (node: TSESTree.TSTypeReference) => {
  // `node.typeName` is `Identifier | TSQualifiedName | ThisExpression` per
  // the TSESTree type, but the typescript-estree parser never produces a
  // `ThisExpression` here in practice: `This` (capitalized) parses as an
  // `Identifier` and `this` (lowercase) is parsed as a dedicated
  // `TSThisType` node rather than a `TSTypeReference`. So this branch is
  // unreachable from any legal TypeScript source.
  /* v8 ignore next -- ThisExpression typeName is unreachable: parser produces Identifier for `This` and TSThisType for `this` */
  if (
    AST_NODE_TYPES.Identifier !== node.typeName.type &&
    AST_NODE_TYPES.TSQualifiedName !== node.typeName.type
  ) {
    return false;
  }
  if (AST_NODE_TYPES.Identifier === node.typeName.type) {
    return isDateIdentifier(node.typeName);
  }
  return isQualifiedNameDate(node.typeName.left, node.typeName.right);
};

const checkTSTypeReference = (
  context: TSESLint.RuleContext<MessageIds, Options>,
  services: ReturnType<typeof getParserServices>,
  node: TSESTree.TSTypeReference
) => {
  if (!isDateTypeReference(node)) {
    return;
  }
  if (
    AST_NODE_TYPES.Identifier === node.typeName.type &&
    !isGlobalDateIdentifier(services, node.typeName)
  ) {
    return;
  }
  context.report({
    data: {
      target: formatTarget(
        effectDateTimeApi.DateReference.import,
        effectDateTimeApi.DateReference.name
      )
    },
    messageId: "preferDateType",
    node
  });
};

const getTypeForNode = (
  services: ReturnType<typeof getParserServices>,
  node: TSESTree.Node
) => {
  const tsNode = services.esTreeNodeToTSNodeMap.get(node);
  /* v8 ignore next -- `getParserServices` types `program` as `Program | null` but throws when it is null (per its default `allowWithoutFullTypeInformation: false` contract), so this defensive branch is unreachable. */
  if (!services.program) {
    return null;
  }
  return services.program.getTypeChecker().getTypeAtLocation(tsNode);
};

const symbolNameOf = (type: Type) => {
  // `Type.symbol` is typed as non-nullable but is `undefined` at runtime for
  // anonymous types (e.g. structural unions like `Date | null`). The cast
  // through `unknown` preserves the runtime fallback without triggering the
  // `no-unnecessary-condition` / `strict-boolean-expressions` rules.
  const { symbol } = type as { symbol?: { name?: string } };
  return symbol?.name ?? "";
};

const isTypeIncludingDate = (type: null | Type) => {
  /* v8 ignore next -- `getTypeForNode` is called with `services.program` which is always non-null under the standard parser configuration, so the `null` branch is unreachable. */
  if (isNil(type)) {
    return false;
  }
  if (type.isUnion()) {
    return type.types.some((member) => {
      return "Date" === symbolNameOf(member);
    });
  }
  return "Date" === symbolNameOf(type);
};

const isReceiverIncludingDate = (
  services: ReturnType<typeof getParserServices>,
  node: TSESTree.Node
) => {
  return isTypeIncludingDate(getTypeForNode(services, node));
};

const dateInstanceMemberTarget = (propertyName: string) => {
  if (isEffectDateTimeApiKey(propertyName)) {
    const entry = effectDateTimeApi[propertyName];
    return formatTarget(entry.import, entry.name);
  }
  return formatTarget("DateTime", "make");
};

const checkDateInstanceMemberCall = (
  context: TSESLint.RuleContext<MessageIds, Options>,
  services: ReturnType<typeof getParserServices>,
  node: TSESTree.CallExpression
) => {
  const { callee } = node;
  if (!isMemberExpression(callee)) {
    return;
  }
  if (!isIdentifier(callee.property)) {
    return;
  }
  // Avoid double-reporting `Date.now()` / `Date.UTC(...)` etc. — those are
  // handled by `checkDateCallExpression` on the parent visitor. The
  // receiver of `Date.<static>` is the `Date` identifier, which would
  // *also* type-check as the global Date. The `isIdentifier` guard below
  // skips that case because the caller is a member call against a literal
  // `Date` identifier rather than an arbitrary expression receiver.
  if (isIdentifier(callee.object) && isDateIdentifier(callee.object)) {
    return;
  }
  if (!isReceiverIncludingDate(services, callee.object)) {
    return;
  }
  context.report({
    data: { target: dateInstanceMemberTarget(callee.property.name) },
    messageId: "preferDateMember",
    node
  });
};

export const preferEffectDateTimeRule = createRule<Options, MessageIds>({
  create(context) {
    const services = getParserServices(context);

    const listener: TSESLint.RuleListener = {
      BinaryExpression(node) {
        checkBinaryExpression(context, services, node);
      },
      CallExpression(node) {
        checkDateCallExpression(context, services, node);
        checkDateInstanceMemberCall(context, services, node);
      },
      MemberExpression(node) {
        checkTemporalMemberExpression(context, services, node);
      },
      NewExpression(node) {
        checkNewDateExpression(context, services, node);
      },
      TSTypeReference(node) {
        checkTSTypeReference(context, services, node);
      }
    };

    return listener;
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Prefer Effect `DateTime` over the JavaScript `Date` global (constructor, statics, prototype methods, type, instanceof) and the `Temporal.*` API surface."
    },
    messages: {
      preferDateInstanceof:
        "Prefer `{{target}}` from `effect/Predicate` over `instanceof Date`.",
      preferDateMember:
        "Prefer `{{target}}` from `effect/DateTime` over the legacy `Date.prototype` method.",
      preferDateStatic:
        "Prefer `{{target}}` from `effect/DateTime` over the global `Date` static method.",
      preferDateType:
        "Prefer `{{target}}` from `effect/DateTime` over the global `Date` type.",
      preferNewDate:
        "Prefer `{{target}}` from `effect/DateTime` over `new Date(...)`.",
      preferTemporal:
        "Prefer `{{target}}` from `effect/DateTime` (or related effect module) over `Temporal`."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-effect-datetime"
});
