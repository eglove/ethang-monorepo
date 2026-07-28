import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";
import join from "lodash/join.js";
import map from "lodash/map.js";

import {
  ensureLodashImport,
  markInnerCallExpressions,
  NATIVE_EQUIVALENT_METHODS,
  resolveCall
} from "../utils/ast.ts";
import { isLodashFunction } from "../utils/lodash-api.ts";
import {
  getIsEmptyReceiver,
  isLodashIdentifierCall,
  resolvePreferImmutable,
  resolvePreferIncludes,
  resolvePreferOverQuantifier,
  resolvePreferTypecheck,
  shouldPreferChunk,
  shouldPreferCompact,
  shouldPreferConstant,
  shouldPreferCountBy,
  shouldPreferFilterPattern,
  shouldPreferFindMember,
  shouldPreferFindShift,
  shouldPreferFlatMap,
  shouldPreferGet,
  shouldPreferInvokeMap,
  shouldPreferIsEmpty,
  shouldPreferIsNil,
  shouldPreferKeyBy,
  shouldPreferMapPattern,
  shouldPreferMatches,
  shouldPreferNoop,
  shouldPreferPartition,
  shouldPreferReject,
  shouldPreferSome,
  shouldPreferStartsWith,
  shouldPreferTimes,
  shouldPreferUniq,
  shouldPreferUnzip,
  shouldPreferZip
} from "../utils/prefer-patterns.ts";
import { isCallExpression, isMemberExpression } from "../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

export type PreferLodashOptions = [
  {
    chainStyle?: "always" | "as-needed" | "never";
    importStyle?: "deep" | "namespace";
  }
];

type MessageIds =
  | "preferChunk"
  | "preferCompact"
  | "preferConstant"
  | "preferCountBy"
  | "preferFilter"
  | "preferFind"
  | "preferFlatMap"
  | "preferGet"
  | "preferImmutable"
  | "preferIncludes"
  | "preferIncludesNegated"
  | "preferInvokeMap"
  | "preferIsEmpty"
  | "preferIsNil"
  | "preferKeyBy"
  | "preferLodash"
  | "preferLodashMethod"
  | "preferMap"
  | "preferMatches"
  | "preferNoop"
  | "preferOverQuantifier"
  | "preferPartition"
  | "preferReject"
  | "preferSome"
  | "preferStartsWith"
  | "preferTimes"
  | "preferTypecheck"
  | "preferUniq"
  | "preferUnzip"
  | "preferZip";

const defaultOptions = {
  chainStyle: "as-needed" as const,
  importStyle: "deep" as const
};

// Methods handled by specific prefer-* patterns on BinaryExpression or
// MemberExpression visitors. The generic preferLodash check in
// reportCallExpression must skip these to avoid double-reporting.
const PATTERN_HANDLED_METHODS = new Set(["findIndex", "indexOf"]);

// Methods that exist on non-array native objects (Map, Set, Headers, etc.)
// and should not trigger chain detection even when chained.
const NON_ARRAY_NATIVE_METHODS = new Set([
  "delete",
  "entries",
  "get",
  "has",
  "keys",
  "max",
  "min",
  "set",
  "update",
  "values"
]);

type RuleContext = TSESLint.RuleContext<MessageIds, PreferLodashOptions>;

const reportArray = (
  context: RuleContext,
  node: TSESTree.CallExpression,
  methodName: string,
  importStyle: "deep" | "namespace"
) => {
  if (!isLodashFunction(methodName)) {
    return;
  }

  const target = "deep" === importStyle ? `lodash/${methodName}.js` : "lodash";

  context.report({
    data: {
      method: methodName,
      target
    },
    fix: (fixer) => {
      if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
        return null;
      }

      const { callee } = node;
      const sourceText = context.sourceCode.getText(callee.object);
      const argumentsText = map(node.arguments, (argument) => {
        return context.sourceCode.getText(argument);
      });
      const callText =
        0 < argumentsText.length
          ? `(${sourceText}, ${join(argumentsText, ", ")})`
          : `(${sourceText})`;

      const replace = fixer.replaceText(node, `${methodName}${callText}`);
      const program = context.sourceCode.ast;
      const importFix = ensureLodashImport(program, methodName, fixer);
      return importFix ? [replace, importFix] : replace;
    },
    messageId: "preferLodash",
    node
  });
};

const reportCallExpression = (
  context: RuleContext,
  node: TSESTree.CallExpression,
  importStyle: "deep" | "namespace",
  handledCallNodes: WeakSet<TSESTree.CallExpression>
) => {
  const program = context.sourceCode.ast;
  const resolvedCall = resolveCall(node, program);

  if ("lodash" === resolvedCall.kind) {
    return;
  }

  if (
    "effect-core" === resolvedCall.kind ||
    "effect-array" === resolvedCall.kind
  ) {
    return;
  }

  if ("array" === resolvedCall.kind) {
    if (handledCallNodes.has(node)) {
      return;
    }
    if (PATTERN_HANDLED_METHODS.has(resolvedCall.methodName)) {
      return;
    }
    if (NATIVE_EQUIVALENT_METHODS.has(resolvedCall.methodName)) {
      return;
    }
    reportArray(context, node, resolvedCall.methodName, importStyle);
  }
};

type CallCheckContext = {
  readonly context: RuleContext;
  readonly handledCallNodes: WeakSet<TSESTree.CallExpression>;
  readonly handledMemberExpressions: WeakSet<TSESTree.MemberExpression>;
  readonly importStyle: "deep" | "namespace";
};

const markInnerCallAndMember = (
  node: TSESTree.CallExpression,
  context: CallCheckContext
) => {
  if (!(
    isMemberExpression(node.callee) && isCallExpression(node.callee.object)
  )) {
    return;
  }

  context.handledCallNodes.add(node.callee.object);
  context.handledMemberExpressions.add(node.callee);
};

const checkCallExpression = (
  node: TSESTree.CallExpression,
  checkContext: CallCheckContext
) => {
  const { context, handledCallNodes } = checkContext;

  // prefer-immutable-method: check both native and lodash calls
  const immutableResult = resolvePreferImmutable(node);
  if (!isNil(immutableResult)) {
    context.report({
      data: {
        method: immutableResult.method,
        preferred: immutableResult.preferred
      },
      messageId: "preferImmutable",
      node
    });
    return;
  }

  // prefer-compact: xs.filter(Boolean) or _.filter(xs, Boolean)
  if (shouldPreferCompact(node)) {
    context.report({ messageId: "preferCompact", node });
    return;
  }

  // Skip further checks if this is a lodash identifier call
  if (isLodashIdentifierCall(node)) {
    return;
  }

  // Table-driven prefer-* checks
  const checks: readonly {
    readonly detect: (node: TSESTree.CallExpression) => boolean;
    readonly markInner?: (node: TSESTree.CallExpression) => void;
    readonly messageId: MessageIds;
  }[] = [
    { detect: shouldPreferMapPattern, messageId: "preferMap" },
    { detect: shouldPreferFilterPattern, messageId: "preferFilter" },
    {
      detect: shouldPreferFindShift,
      markInner: (n) => {
        if (isMemberExpression(n.callee) && isCallExpression(n.callee.object)) {
          handledCallNodes.add(n.callee.object);
        }
      },
      messageId: "preferFind"
    },
    { detect: shouldPreferReject, messageId: "preferReject" },
    { detect: shouldPreferMatches, messageId: "preferMatches" },
    {
      detect: shouldPreferFlatMap,
      markInner: (n) => {
        markInnerCallAndMember(n, checkContext);
      },
      messageId: "preferFlatMap"
    },
    {
      detect: shouldPreferTimes,
      markInner: (n) => {
        markInnerCallAndMember(n, checkContext);
      },
      messageId: "preferTimes"
    },
    { detect: shouldPreferUnzip, messageId: "preferUnzip" },
    { detect: shouldPreferZip, messageId: "preferZip" },
    { detect: shouldPreferCountBy, messageId: "preferCountBy" },
    { detect: shouldPreferKeyBy, messageId: "preferKeyBy" },
    { detect: shouldPreferChunk, messageId: "preferChunk" }
  ];

  for (const check of checks) {
    if (check.detect(node)) {
      check.markInner?.(node);
      context.report({ messageId: check.messageId, node });
      return;
    }
  }

  // prefer-partition: requires program-walking, so dispatched outside the table
  const program = context.sourceCode.ast;
  if (shouldPreferPartition(node, program)) {
    context.report({ messageId: "preferPartition", node });
    return;
  }

  // prefer-over-quantifier (returns a string, not boolean)
  const overQuant = resolvePreferOverQuantifier(node);
  if (!isNil(overQuant)) {
    context.report({
      data: { lodash: overQuant },
      messageId: "preferOverQuantifier",
      node
    });
    return;
  }

  // prefer-invoke-map
  if (shouldPreferInvokeMap(node)) {
    const iteratee = node.arguments.at(0);

    if (!isNil(iteratee)) {
      markInnerCallExpressions(iteratee, handledCallNodes);
    }
    context.report({ messageId: "preferInvokeMap", node });
    return;
  }

  // Original array method conversion check
  reportCallExpression(
    context,
    node,
    checkContext.importStyle,
    handledCallNodes
  );
};

const checkLogicalExpression = (
  node: TSESTree.LogicalExpression,
  context: RuleContext
) => {
  if (shouldPreferIsNil(node)) {
    context.report({ messageId: "preferIsNil", node });
    return;
  }

  // prefer-get: a && a.b && a.b.c
  if (shouldPreferGet(node)) {
    const { parent } = node;
    if (
      parent.type === AST_NODE_TYPES.LogicalExpression &&
      "&&" === parent.operator
    ) {
      return;
    }
    context.report({ messageId: "preferGet", node });
  }
};

const checkBinaryExpression = (
  node: TSESTree.BinaryExpression,
  context: RuleContext
) => {
  // prefer-lodash-typecheck
  const typecheckLodash = resolvePreferTypecheck(node);
  if (!isNil(typecheckLodash)) {
    context.report({
      data: { lodash: typecheckLodash, native: "typeof" },
      messageId: "preferTypecheck",
      node
    });
    return;
  }

  // prefer-includes
  const includesResult = resolvePreferIncludes(node);
  if (!isNil(includesResult)) {
    context.report({ messageId: includesResult, node });
    return;
  }

  // prefer-startswith
  if (shouldPreferStartsWith(node)) {
    context.report({ messageId: "preferStartsWith", node });
    return;
  }

  // prefer-some
  if (shouldPreferSome(node)) {
    context.report({ messageId: "preferSome", node });
  }

  // prefer-is-empty
  if (shouldPreferIsEmpty(node)) {
    const receiver = getIsEmptyReceiver(node);
    // getIsEmptyReceiver only returns null when shouldPreferIsEmpty returns
    // false (mutually exclusive by construction).

    if (isNil(receiver)) {
      context.report({ messageId: "preferIsEmpty", node });
    } else {
      const receiverText = context.sourceCode.getText(receiver);
      context.report({
        fix: (fixer) => {
          const replace = fixer.replaceText(node, `isEmpty(${receiverText})`);
          const program = context.sourceCode.ast;
          const importFix = ensureLodashImport(program, "isEmpty", fixer);
          return importFix ? [replace, importFix] : replace;
        },
        messageId: "preferIsEmpty",
        node
      });
    }
  }
};

const checkFunction = (
  node:
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression,
  context: RuleContext
) => {
  // prefer-noop: empty function body
  if (shouldPreferNoop(node)) {
    context.report({ messageId: "preferNoop", node });
    return;
  }

  // prefer-constant: returns a literal
  if (shouldPreferConstant(node)) {
    context.report({ messageId: "preferConstant", node });
  }
};

const checkLodashChain = (
  node: TSESTree.MemberExpression,
  context: RuleContext
) => {
  if (AST_NODE_TYPES.CallExpression !== node.object.type) {
    return;
  }

  const firstCallee = node.object.callee;
  if (AST_NODE_TYPES.MemberExpression !== firstCallee.type) {
    return;
  }
  if (AST_NODE_TYPES.Identifier !== firstCallee.property.type) {
    return;
  }
  if (AST_NODE_TYPES.Identifier !== node.property.type) {
    return;
  }

  const firstName = firstCallee.property.name;
  const secondName = node.property.name;

  if (!isLodashFunction(firstName) || !isLodashFunction(secondName)) {
    return;
  }

  if (
    NON_ARRAY_NATIVE_METHODS.has(firstName) ||
    NON_ARRAY_NATIVE_METHODS.has(secondName)
  ) {
    return;
  }

  // If the chain's root receiver is a builtin namespace (Math, Buffer,
  // JSON, etc.) the chain is being applied to a non-array receiver, so the
  // "prefer lodash chain" suggestion does not apply. Walk past any
  // intermediate MemberExpression / CallExpression layers to the root
  // identifier and check `BUILTIN_NAMESPACES` via the resolver.
  const program = context.sourceCode.ast;
  const resolved = resolveCall(node.object, program);
  if ("unknown-member" === resolved.kind) {
    return;
  }

  context.report({
    data: {
      first: firstName,
      second: secondName
    },
    messageId: "preferLodashMethod",
    node
  });
};

export const preferLodashRule = createRule<PreferLodashOptions, MessageIds>({
  create(context) {
    const [options] = context.options;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- optional properties are undefined at runtime with exactOptionalPropertyTypes
    const chainStyle = options?.chainStyle ?? defaultOptions.chainStyle;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- optional properties are undefined at runtime with exactOptionalPropertyTypes
    const importStyle = options?.importStyle ?? defaultOptions.importStyle;

    const handledCallNodes = new WeakSet<TSESTree.CallExpression>();
    const handledMemberExpressions = new WeakSet<TSESTree.MemberExpression>();

    const callCheckContext: CallCheckContext = {
      context,
      handledCallNodes,
      handledMemberExpressions,
      importStyle
    };

    const listener: TSESLint.RuleListener = {
      ArrowFunctionExpression: (node) => {
        checkFunction(node, context);
      },
      BinaryExpression: (node) => {
        checkBinaryExpression(node, context);
      },
      CallExpression(node) {
        checkCallExpression(node, callCheckContext);
      },
      FunctionDeclaration: (node) => {
        checkFunction(node, context);
      },
      FunctionExpression: (node) => {
        checkFunction(node, context);
      },
      LogicalExpression: (node) => {
        checkLogicalExpression(node, context);
      },
      MemberExpression: (node: TSESTree.MemberExpression) => {
        if (handledMemberExpressions.has(node)) {
          return;
        }

        // prefer-find: filter(...)[0] — MemberExpression with computed literal 0
        if (shouldPreferFindMember(node)) {
          if (isCallExpression(node.object)) {
            handledCallNodes.add(node.object);
          }
          context.report({ messageId: "preferFind", node });
          return;
        }

        if ("always" !== chainStyle && "as-needed" !== chainStyle) {
          return;
        }

        checkLodashChain(node, context);
      },
      NewExpression: (node: TSESTree.NewExpression) => {
        if (shouldPreferUniq(node)) {
          context.report({ messageId: "preferUniq", node });
        }
      }
    };

    return listener;
  },
  defaultOptions: [defaultOptions],
  meta: {
    docs: {
      description:
        "Prefer lodash (full API surface) over Array.prototype / Object.* / native methods when an equivalent exists."
    },
    fixable: "code",
    messages: {
      preferChunk:
        "Prefer `_.chunk` over the canonical `while`/`for` chunk-slice loop.",
      preferCompact:
        "Prefer `_.compact` over `filter(Boolean)` or `filter(x => Boolean(x))`.",
      preferConstant:
        "Prefer `_.constant` for functions that always return a literal value.",
      preferCountBy:
        "Prefer `_.countBy` over `reduce` building an object literal with `(acc[k] ?? 0) + 1`.",
      preferFilter:
        "Prefer `_.filter` over `forEach` with an `if` + `push` pattern.",
      preferFind:
        "Prefer `_.find` over `filter(...)[0]` or `filter(...).shift()`.",
      preferFlatMap: "Prefer `_.flatMap` over `map(...).flatten()`.",
      preferGet:
        "Prefer `_.get` over manual `&&` chaining for nested property access.",
      preferImmutable:
        "Prefer immutable `_.{{preferred}}` over mutating `_.{{method}}`.",
      preferIncludes: "Prefer `_.includes` over `indexOf(...) !== -1`.",
      preferIncludesNegated: "Prefer `!_.includes` over `indexOf(...) === -1`.",
      preferInvokeMap: "Prefer `_.invokeMap` over `map(x => x.method())`.",
      preferIsEmpty: "Prefer `_.isEmpty` over `x.length === 0` length checks.",
      preferIsNil: "Prefer `_.isNil` over `x === null || x === undefined`.",
      preferKeyBy:
        "Prefer `_.keyBy` over `reduce` building an object literal keyed by an iteratee.",
      preferLodash:
        "Prefer `{{target}}` from the `lodash` package over native `{{method}}`.",
      preferLodashMethod:
        "Consider using a `lodash` chain when chaining native collection methods.",
      preferMap: "Prefer `_.map` over `forEach` with a `push` pattern.",
      preferMatches:
        "Prefer `_.matches` over `filter` with multiple `===` checks.",
      preferNoop: "Prefer `_.noop` for functions with an empty body.",
      preferOverQuantifier:
        "Prefer `_.{{lodash}}` over combining predicates with `&&` / `||`.",
      preferPartition:
        "Prefer `_.partition` over two `filter` calls (one negated) on the same receiver.",
      preferReject: "Prefer `_.reject` over `filter` with a negated predicate.",
      preferSome: "Prefer `_.some` over `findIndex(...) !== -1`.",
      preferStartsWith: "Prefer `_.startsWith` over `indexOf(...) === 0`.",
      preferTimes: "Prefer `_.times` over `Array(n).fill(0).map(fn)`.",
      preferTypecheck: "Prefer `_.{{lodash}}` over `{{native}}` check.",
      preferUniq: "Prefer `_.uniq` over `[...new Set(arr)]`.",
      preferUnzip:
        "Prefer `_.unzip` over the nested `arr[0].map((_, i) => arr.map(r => r[i]))` pattern.",
      preferZip:
        "Prefer `_.zip` over the nested `arrs[0].map((_, i) => arrs.map(a => a[i]))` pattern."
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          chainStyle: {
            enum: ["always", "as-needed", "never"],
            type: "string"
          },
          importStyle: { enum: ["deep", "namespace"], type: "string" }
        },
        type: "object"
      }
    ],
    type: "suggestion"
  },
  name: "prefer-lodash"
});

export { lodashDeepImport } from "../utils/ast.ts";
