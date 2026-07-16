import type { RuleFix } from "@typescript-eslint/utils/ts-eslint";

import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import filter from "lodash/filter.js";
import includes from "lodash/includes.js";
import isArray from "lodash/isArray.js";
import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";
import keys from "lodash/keys.js";
import map from "lodash/map.js";
import some from "lodash/some.js";
import startsWith from "lodash/startsWith.js";

import { effectApi, isEffectApiMethod } from "./effect-api.ts";
import {
  hasNativeArrayAlias,
  isCommonUserMethodName,
  isLodashArrayFunction,
  isLodashFunction,
  lodashApi
} from "./lodash-api.ts";
import { isCallExpression } from "./type-guards.ts";

type RuleFixer = {
  insertTextAfter: (
    nodeOrToken: TSESTree.Node | TSESTree.Token,
    text: string
  ) => RuleFix;
  insertTextAfterRange: (
    range: Readonly<[number, number]>,
    text: string
  ) => RuleFix;
  insertTextBefore: (
    nodeOrToken: TSESTree.Node | TSESTree.Token,
    text: string
  ) => RuleFix;
  insertTextBeforeRange: (
    range: Readonly<[number, number]>,
    text: string
  ) => RuleFix;
  remove: (nodeOrToken: TSESTree.Node | TSESTree.Token) => RuleFix;
  removeRange: (range: Readonly<[number, number]>) => RuleFix;
  replaceText: (
    nodeOrToken: TSESTree.Node | TSESTree.Token,
    text: string
  ) => RuleFix;
  replaceTextRange: (
    range: Readonly<[number, number]>,
    text: string
  ) => RuleFix;
};

const isLodashDefaultImport = (name: string) => {
  return "lodash" === name || startsWith(name, "lodash/");
};

const isLodashNamespaceReceiver = (callee: TSESTree.MemberExpression) => {
  return (
    AST_NODE_TYPES.Identifier === callee.object.type &&
    ("_" === callee.object.name || "lodash" === callee.object.name)
  );
};

const BUILTIN_NAMESPACES = new Set([
  "Array",
  "Boolean",
  "console",
  "CSS",
  "Date",
  "Error",
  "JSON",
  "Map",
  "Math",
  "Number",
  "Object",
  "performance",
  "Promise",
  "Proxy",
  "Reflect",
  "RegExp",
  "Set",
  "String",
  "Symbol",
  "WeakMap",
  "WeakSet"
]);

const isEffectSource = (name: string) => {
  return "effect" === name || startsWith(name, "effect/");
};

export type ImportedKind = "effect" | "lodash" | "none";

const classifyImport = (node: TSESTree.Node) => {
  if (AST_NODE_TYPES.ImportDeclaration !== node.type) {
    return "none";
  }

  const source = node.source.value;

  if (isEffectSource(source)) {
    return "effect";
  }

  if (isLodashDefaultImport(source)) {
    return "lodash";
  }

  return "none";
};

const detectImportKind = (program: TSESTree.Program) => {
  const kinds = map(program.body, classifyImport);

  if (includes(kinds, "effect")) {
    return "effect";
  }

  if (includes(kinds, "lodash")) {
    return "lodash";
  }

  return "none";
};

export const getImportedKind = (context: {
  readonly sourceCode: { readonly ast: TSESTree.Program };
}) => {
  return detectImportKind(context.sourceCode.ast);
};

const isEffectImportNode = (node: TSESTree.Node) => {
  return (
    AST_NODE_TYPES.ImportDeclaration === node.type &&
    "effect" === node.source.value
  );
};

const hasEffectImport = (program: TSESTree.Program) => {
  return some(program.body, isEffectImportNode);
};

const isLodashDeepImportNode = (node: TSESTree.Node, importName: string) => {
  if (AST_NODE_TYPES.ImportDeclaration !== node.type) {
    return false;
  }
  return node.source.value === `lodash/${importName}.js`;
};

const hasLodashDeepImport = (program: TSESTree.Program, importName: string) => {
  return some(program.body, (node) => {
    return isLodashDeepImportNode(node, importName);
  });
};

const insertImportAfterLastStatement = (
  program: TSESTree.Program,
  fixer: RuleFixer,
  text: string
) => {
  const lastNode = program.body.at(-1);
  const anchor = lastNode ?? program;

  return fixer.insertTextAfter(anchor, text);
};

export const ensureEffectImport = (
  program: TSESTree.Program,
  fixer: RuleFixer
) => {
  if (hasEffectImport(program)) {
    return null;
  }

  return insertImportAfterLastStatement(
    program,
    fixer,
    '\nimport { Array } from "effect";'
  );
};

export const ensureLodashImport = (
  program: TSESTree.Program,
  importName: string,
  fixer: RuleFixer
) => {
  if (hasLodashDeepImport(program, importName)) {
    return null;
  }

  return insertImportAfterLastStatement(
    program,
    fixer,
    `\nimport ${importName} from "lodash/${importName}.js";`
  );
};

export type CallKind =
  | "array"
  | "effect-array"
  | "effect-core"
  | "lodash"
  | "other"
  | "unknown-member";

export type ResolvedCall = {
  readonly effectImportName?: string;
  readonly kind: CallKind;
  readonly lodashImportName?: string;
  readonly methodName: string;
  readonly node: TSESTree.CallExpression;
  readonly receiver: null | TSESTree.Expression;
};

const isIdentifierNamed = (
  node: TSESTree.Expression,
  names: readonly string[]
) => {
  return AST_NODE_TYPES.Identifier === node.type && includes(names, node.name);
};

const isArrayLiteralReceiver = (callee: TSESTree.MemberExpression) => {
  return AST_NODE_TYPES.ArrayExpression === callee.object.type;
};

const resolveMemberMethod = (node: TSESTree.MemberExpression) => {
  if (AST_NODE_TYPES.Identifier === node.property.type && !node.computed) {
    return node.property.name;
  }
  if (AST_NODE_TYPES.Literal === node.property.type) {
    const { value } = node.property;
    return "string" === typeof value ? value : "";
  }
  return "";
};

const EFFECT_ARRAY_IDENTIFIERS = ["Array", "Effects", "Array$"];
const EFFECT_ARRAY_IMPORT = "Array";
const KIND_EFFECT_ARRAY = "effect-array";

const resolveEffectArray = (
  node: TSESTree.CallExpression,
  callee: TSESTree.MemberExpression,
  methodName: string
) => {
  if (AST_NODE_TYPES.Identifier !== callee.object.type) {
    return null;
  }
  if (!isIdentifierNamed(callee.object, EFFECT_ARRAY_IDENTIFIERS)) {
    return null;
  }
  const result: ResolvedCall = {
    effectImportName: EFFECT_ARRAY_IMPORT,
    kind: KIND_EFFECT_ARRAY,
    methodName,
    node,
    receiver: callee.object
  };
  return result;
};

const resolveEffectCore = (
  node: TSESTree.CallExpression,
  callee: TSESTree.MemberExpression,
  methodName: string
) => {
  if (AST_NODE_TYPES.Identifier !== callee.object.type) {
    return null;
  }
  if (!isIdentifierNamed(callee.object, ["Effect", "Effect$"])) {
    return null;
  }
  const result: ResolvedCall = {
    effectImportName: "Effect",
    kind: "effect-core",
    methodName,
    node,
    receiver: callee.object
  };
  return result;
};

export const NATIVE_EQUIVALENT_METHODS = new Set([
  "add",
  "at",
  "clone",
  "delete",
  "each",
  "endsWith",
  "entries",
  "eq",
  "find",
  "findLast",
  "flat",
  "flatMap",
  "forEach",
  "get",
  "has",
  "includes",
  "join",
  "keys",
  "make",
  "max",
  "min",
  "orderBy",
  "set",
  "slice",
  "startsWith",
  "toArray",
  "toString",
  "update",
  "values"
]);

// Methods that are NOT on Array.prototype but exist on other native objects
// (Map, Set, Headers, drizzle query builders, etc.). These should be treated
// as unknown-member rather than array to avoid false positives.
const NON_ARRAY_NATIVE_METHOD_NAMES = new Set([
  "add",
  "clone",
  "delete",
  "each",
  "endsWith",
  "entries",
  "eq",
  "get",
  "has",
  "join",
  "keys",
  "make",
  "max",
  "min",
  "orderBy",
  "set",
  "startsWith",
  "toArray",
  "toString",
  "update",
  "values"
]);

export const isEffectImportedIdentifier = (
  node: TSESTree.Node,
  program: TSESTree.Program
) => {
  if (AST_NODE_TYPES.Identifier !== node.type) {
    return false;
  }
  const { name } = node;
  return some(program.body, (statement) => {
    if (AST_NODE_TYPES.ImportDeclaration !== statement.type) {
      return false;
    }
    if (!isEffectSource(statement.source.value)) {
      return false;
    }
    return some(statement.specifiers, (spec) => {
      if (AST_NODE_TYPES.ImportSpecifier !== spec.type) {
        return false;
      }
      return includes([name], spec.local.name);
    });
  });
};

const isChainedArrayLike = (
  innerCall: TSESTree.CallExpression,
  methodName: string,
  isLodashOrEffectMethod: boolean,
  program?: TSESTree.Program
) => {
  const innerResolved = resolveMemberExpressionCall(innerCall, program);
  if ("array" === innerResolved.kind) {
    return true;
  }
  // For non-array chains, only flag methods that have a native
  // Array.prototype equivalent (like `map`, `filter`). Collection-only
  // lodash methods like `groupBy` have no Array.prototype equivalent and
  // should not be flagged on unknown builder chains.
  return (
    isLodashOrEffectMethod &&
    hasNativeArrayAlias(methodName) &&
    !isCommonUserMethodName(methodName)
  );
};

const isReceiverArrayLike = (
  callee: TSESTree.MemberExpression,
  methodName: string,
  program?: TSESTree.Program
) => {
  const isNonArrayNativeMethod = NON_ARRAY_NATIVE_METHOD_NAMES.has(methodName);
  const isLodashOrEffectMethod =
    !isNonArrayNativeMethod &&
    (isLodashFunction(methodName) || isEffectApiMethod(methodName));

  if (isArrayLiteralReceiver(callee)) {
    return isLodashOrEffectMethod;
  }

  // For chained method calls (receiver is a CallExpression), check if the
  // inner call resolves to an array method. If the inner call is on a
  // query builder or other non-array receiver, this is not an array call.
  // e.g. `xs.map(fn).filter(fn)` — inner `map` is array, so `filter` is too
  // but `database.select().from(t).groupBy(t.id)` — inner is not array
  if (AST_NODE_TYPES.CallExpression === callee.object.type) {
    return isChainedArrayLike(
      callee.object,
      methodName,
      isLodashOrEffectMethod,
      program
    );
  }

  // For identifier receivers, only Array.prototype methods (category "array"
  // or "collection") should trigger as array calls. Lodash functions in other
  // categories (e.g. `create` is category "object") are not Array.prototype
  // methods and may be called on arbitrary user objects (Cloudflare Workflow
  // bindings, etc.). String/number methods like `camelCase` are still flagged
  // since they are not real methods on any standard type, unless they share a
  // name with a common user-defined method.
  // Methods in NON_ARRAY_NATIVE_METHOD_NAMES (like `orderBy`, `get`, `set`)
  // exist on non-array native objects and should not be classified as array.
  if (isNonArrayNativeMethod) {
    return false;
  }
  if (isLodashArrayFunction(methodName)) {
    return true;
  }

  return isLodashOrEffectMethod && !isCommonUserMethodName(methodName);
};

const resolveArrayCall = (
  node: TSESTree.CallExpression,
  callee: TSESTree.MemberExpression,
  methodName: string,
  program?: TSESTree.Program
) => {
  // If the receiver is _ or lodash, this is already a lodash call
  if (isLodashNamespaceReceiver(callee)) {
    const result: ResolvedCall = {
      kind: "lodash",
      lodashImportName: methodName,
      methodName,
      node,
      receiver: callee.object
    };
    return result;
  }

  // If the receiver is an identifier imported from "effect" (e.g. Schema,
  // Stream, DateTime, Chunk, Option, etc.), this is an Effect namespace call
  // — not an array call — so it should not trigger prefer-effect/lodash.
  if (
    !isNil(program) &&
    AST_NODE_TYPES.Identifier === callee.object.type &&
    isEffectImportedIdentifier(callee.object, program)
  ) {
    const result: ResolvedCall = {
      effectImportName: callee.object.name,
      kind: KIND_EFFECT_ARRAY,
      methodName,
      node,
      receiver: callee.object
    };
    return result;
  }

  // Math.* and JSON.* etc. are built-in namespaces, not array receivers
  if (
    AST_NODE_TYPES.Identifier === callee.object.type &&
    BUILTIN_NAMESPACES.has(callee.object.name)
  ) {
    const result: ResolvedCall = {
      kind: "unknown-member",
      methodName,
      node,
      receiver: callee.object
    };
    return result;
  }

  if (isReceiverArrayLike(callee, methodName, program)) {
    const result: ResolvedCall = {
      kind: "array",
      methodName,
      node,
      receiver: callee.object
    };
    return result;
  }
  const result: ResolvedCall = {
    kind: "unknown-member",
    methodName,
    node,
    receiver: callee.object
  };
  return result;
};

export const resolveMemberExpressionCall = (
  node: TSESTree.CallExpression,
  program?: TSESTree.Program
) => {
  const { callee } = node;
  if (AST_NODE_TYPES.MemberExpression !== callee.type) {
    const result: ResolvedCall = {
      kind: "other",
      methodName: "",
      node,
      receiver: null
    };
    return result;
  }
  const methodName = resolveMemberMethod(callee);

  const resolved =
    resolveEffectArray(node, callee, methodName) ??
    resolveEffectCore(node, callee, methodName) ??
    resolveArrayCall(node, callee, methodName, program);
  const result: ResolvedCall = resolved;
  return result;
};

const resolveIdentifierCall = (node: TSESTree.CallExpression) => {
  const { callee } = node;

  if (AST_NODE_TYPES.Identifier !== callee.type) {
    const result: ResolvedCall = {
      kind: "other",
      methodName: "",
      node,
      receiver: null
    };
    return result;
  }

  if (isLodashFunction(callee.name)) {
    const result: ResolvedCall = {
      kind: "lodash",
      lodashImportName: callee.name,
      methodName: callee.name,
      node,
      receiver: null
    };
    return result;
  }

  if (isEffectApiMethod(callee.name)) {
    const entry = effectApi[callee.name];

    const result: ResolvedCall = {
      effectImportName: entry.import,
      kind: KIND_EFFECT_ARRAY,
      methodName: callee.name,
      node,
      receiver: null
    };
    return result;
  }

  const result: ResolvedCall = {
    kind: "other",
    methodName: callee.name,
    node,
    receiver: null
  };
  return result;
};

export const resolveCall = (
  node: TSESTree.CallExpression,
  program: TSESTree.Program
) => {
  if (AST_NODE_TYPES.MemberExpression === node.callee.type) {
    return resolveMemberExpressionCall(node, program);
  }
  return resolveIdentifierCall(node);
};

export const isLodashCall = (
  node: TSESTree.CallExpression,
  program: TSESTree.Program
) => {
  return "lodash" === resolveCall(node, program).kind;
};

export const lodashDeepImport = (name: string) => {
  return `lodash/${name}.js`;
};

export const lookupLodashEntry = (name: string) => {
  if (isLodashFunction(name)) {
    return lodashApi[name];
  }
  return null;
};

export const markInnerCallExpressions = (
  node: TSESTree.Node,
  set: WeakSet<TSESTree.CallExpression>
) => {
  if (isCallExpression(node)) {
    set.add(node);
  }

  for (const child of getChildNodes(node)) {
    markInnerCallExpressions(child, set);
  }
};

const SKIP_KEYS = new Set(["loc", "parent", "range"]);

const isNodeLike = (value: unknown): value is TSESTree.Node => {
  return isObject(value) && "type" in value;
};

const collectFromArray = (value: unknown[], children: TSESTree.Node[]) => {
  for (const item of value) {
    if (isNodeLike(item)) {
      children.push(item);
    }
  }
};

export const getChildNodes = (node: TSESTree.Node) => {
  const children: TSESTree.Node[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- AST nodes are record-like
  const record = node as unknown as Record<string, unknown>;
  const allKeys = filter(keys(record), (key) => {
    return !SKIP_KEYS.has(key);
  });

  for (const key of allKeys) {
    const value = record[key];
    if (isNodeLike(value)) {
      children.push(value);
    }

    if (isArray(value)) {
      collectFromArray(value, children);
    }
  }

  return children;
};

export { getParserServices } from "@typescript-eslint/utils/eslint-utils";
