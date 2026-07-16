// Lodash v4 method aliases. The key is the main method name; the value is
// the list of aliases. `preferred-alias` and `consistent-compose` use this
// to suggest the canonical name.
export const LODASH_V4_ALIASES: ReadonlyMap<string, readonly string[]> =
  new Map([
    ["assignIn", ["extend"]],
    ["assignInWith", ["extendWith"]],
    ["forEach", ["each"]],
    ["forEachRight", ["eachRight"]],
    ["head", ["first"]],
    ["toPairs", ["entries"]],
    ["toPairsIn", ["entriesIn"]],
    ["value", ["toJSON", "valueOf"]]
  ]);

// Reverse lookup: alias → main method name
export const LODASH_V4_ALIAS_TO_MAIN: ReadonlyMap<string, string> = new Map(
  flatMap([...LODASH_V4_ALIASES], ([main, aliases]) => {
    return map(aliases, (alias) => {
      return [alias, main] as const;
    });
  })
);

// Composition direction groups. `flow` and `pipe` are left-to-right;
// `flowRight` and `compose` are right-to-left.
export const COMPOSE_LEFT_TO_RIGHT = new Set(["flow", "pipe"]);
export const COMPOSE_RIGHT_TO_LEFT = new Set(["compose", "flowRight"]);
export const ALL_COMPOSE_METHODS = new Set([
  "compose",
  "flow",
  "flowRight",
  "pipe"
]);

// Returns the main method name for a given alias, or the method itself if
// it is already the main name (or not an alias).
export const getMainAlias = (method: string) => {
  return LODASH_V4_ALIAS_TO_MAIN.get(method) ?? method;
};

// Returns true if the method is the main (non-alias) name.
export const isMainAlias = (method: string) => {
  return LODASH_V4_ALIASES.has(method);
};

// Lodash v4 methods that support shorthand iteratees (identity and prop
// shorthand). Used by `identity-shorthand` and `property-shorthand` rules.
export const SHORTHAND_METHODS: ReadonlySet<string> = new Set([
  "countBy",
  "differenceBy",
  "dropRightWhile",
  "dropWhile",
  "every",
  "filter",
  "find",
  "findIndex",
  "findKey",
  "findLast",
  "findLastIndex",
  "findLastKey",
  "flatMap",
  "flatMapDeep",
  "flatMapDepth",
  "groupBy",
  "intersectionBy",
  "invertBy",
  "map",
  "mapValues",
  "maxBy",
  "minBy",
  "omitBy",
  "overEvery",
  "overSome",
  "partition",
  "pickBy",
  "pullAllBy",
  "reject",
  "remove",
  "some",
  "sortedIndexBy",
  "sortedLastIndexBy",
  "sortedUniqBy",
  "sumBy",
  "takeRightWhile",
  "takeWhile",
  "unionBy",
  "uniqBy",
  "xorBy"
]);

// `sortBy` supports only property shorthand, not identity shorthand.
export const PROPERTY_ONLY_SHORTHAND_METHODS: ReadonlySet<string> = new Set([
  "sortBy"
]);

// Returns true if the method supports identity shorthand (omit iteratee
// entirely when it returns its argument).
export const isIdentityShorthandMethod = (method: string) => {
  return SHORTHAND_METHODS.has(method);
};

// All methods that support property shorthand (identity shorthand methods + property-only).
const PROPERTY_SHORTHAND_METHODS: ReadonlySet<string> = SHORTHAND_METHODS.union(
  PROPERTY_ONLY_SHORTHAND_METHODS
);

// Returns true if the method supports property shorthand (string path iteratee).
export const isPropertyShorthandMethod = (method: string) => {
  return PROPERTY_SHORTHAND_METHODS.has(method);
};

// Returns true if the method supports matches shorthand (object literal iteratee).
// Same set as identity shorthand — all shorthand methods support matches.
export const isMatchesShorthandMethod = (method: string) => {
  return SHORTHAND_METHODS.has(method);
};

// Lodash v4 methods that are chainable (can be used in a chain).
// Source: eslint-plugin-lodash methodDataByVersion/4.js
export const CHAINABLE_METHODS: ReadonlySet<string> = new Set([
  "after",
  "ary",
  "assign",
  "assignIn",
  "assignInWith",
  "assignWith",
  "at",
  "before",
  "bind",
  "bindAll",
  "bindKey",
  "castArray",
  "chain",
  "chunk",
  "commit",
  "compact",
  "concat",
  "conforms",
  "constant",
  "countBy",
  "create",
  "curry",
  "debounce",
  "defaults",
  "defaultsDeep",
  "defer",
  "delay",
  "difference",
  "differenceBy",
  "differenceWith",
  "drop",
  "dropRight",
  "dropRightWhile",
  "dropWhile",
  "fill",
  "filter",
  "flatMap",
  "flatMapDeep",
  "flatMapDepth",
  "flatten",
  "flattenDeep",
  "flattenDepth",
  "flip",
  "flow",
  "flowRight",
  "fromPairs",
  "functions",
  "functionsIn",
  "groupBy",
  "initial",
  "intersection",
  "intersectionBy",
  "intersectionWith",
  "invert",
  "invertBy",
  "invokeMap",
  "iteratee",
  "keyBy",
  "keys",
  "keysIn",
  "map",
  "mapKeys",
  "mapValues",
  "matches",
  "matchesProperty",
  "memoize",
  "merge",
  "mergeWith",
  "method",
  "methodOf",
  "mixin",
  "negate",
  "next",
  "nthArg",
  "omit",
  "omitBy",
  "once",
  "orderBy",
  "over",
  "overArgs",
  "overEvery",
  "overSome",
  "partial",
  "partialRight",
  "partition",
  "pick",
  "pickBy",
  "plant",
  "property",
  "propertyOf",
  "pull",
  "pullAll",
  "pullAllBy",
  "pullAllWith",
  "pullAt",
  "push",
  "range",
  "rangeRight",
  "rearg",
  "reject",
  "remove",
  "rest",
  "reverse",
  "sampleSize",
  "set",
  "setWith",
  "shuffle",
  "slice",
  "sort",
  "sortBy",
  "sortedUniq",
  "sortedUniqBy",
  "splice",
  "spread",
  "tail",
  "take",
  "takeRight",
  "takeRightWhile",
  "takeWhile",
  "tap",
  "throttle",
  "thru",
  "toArray",
  "toPairs",
  "toPairsIn",
  "toPath",
  "toPlainObject",
  "transform",
  "unary",
  "union",
  "unionBy",
  "unionWith",
  "uniq",
  "uniqBy",
  "uniqWith",
  "unset",
  "unshift",
  "unzip",
  "unzipWith",
  "update",
  "updateWith",
  "values",
  "valuesIn",
  "without",
  "wrap",
  "xor",
  "xorBy",
  "xorWith",
  "zip",
  "zipObject",
  "zipObjectDeep",
  "zipWith"
]);

// Lodash v4 wrapper methods (methods that wrap a value in a chain).
export const WRAPPER_METHODS: ReadonlySet<string> = new Set([
  "concat",
  "join",
  "next",
  "pop",
  "push",
  "replace",
  "shift",
  "sort",
  "splice",
  "split",
  "unshift",
  "value"
]);

// Chain breaker methods (methods that end a chain, e.g. `value`).
export const CHAIN_BREAKER_METHODS: ReadonlySet<string> = new Set([
  "toJSON",
  "value",
  "valueOf"
]);

// Returns true if the method is chainable in lodash v4.
export const isChainableMethod = (method: string) => {
  return CHAINABLE_METHODS.has(getMainAlias(method));
};

// Returns true if the method is a chain breaker in lodash v4.
export const isChainBreakerMethod = (method: string) => {
  return CHAIN_BREAKER_METHODS.has(getMainAlias(method));
};

// Returns true if the method is a wrapper method in lodash v4.
export const isWrapperMethod = (method: string) => {
  return WRAPPER_METHODS.has(method);
};

// Maximum argument count for lodash methods (used by callback-binding).
// This is a simplified version; most lodash methods accept 1-4 args.
export const getMethodMaxArguments = (method: string) => {
  const maxArguments: Record<string, number> = {
    assign: 2,
    assignIn: 2,
    assignInWith: 4,
    assignWith: 4,
    clone: 1,
    cloneDeep: 1,
    cloneDeepWith: 2,
    cloneWith: 2,
    differenceBy: 3,
    differenceWith: 3,
    intersectionBy: 3,
    intersectionWith: 3,
    merge: 2,
    mergeWith: 4,
    pullAllBy: 3,
    pullAllWith: 3,
    unionBy: 3,
    unionWith: 3,
    xorBy: 3,
    xorWith: 3,
    zipWith: 3
  };
  return maxArguments[method] ?? 3;
};
import flatMap from "lodash/flatMap.js";
import map from "lodash/map.js";
