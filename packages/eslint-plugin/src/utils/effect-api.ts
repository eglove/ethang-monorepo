// Map of native Array.prototype / Set / Map methods to the equivalent
// `effect` functions. The disambiguation logic in the prefer-effect rule
// consults this table to decide whether an Array.prototype call should
// really be rewritten to an Effect call.
//
// The keys are Array.prototype method names (lowercase, no `Array.prototype.`
// prefix); the values are the canonical effect module exports to use.
export const effectApi = {
  // Array.prototype -> Effect / Array module
  chunk: {
    description: "Effect-friendly chunk.",
    import: "Array",
    name: "chunk"
  },
  empty: {
    description: "Effect-friendly empty.",
    import: "Array",
    name: "empty"
  },
  every: {
    description: "Effect-friendly every.",
    import: "Array",
    name: "every"
  },
  filter: {
    description: "Effect-friendly filter preserving the effect context.",
    import: "Array",
    name: "filter"
  },
  find: { description: "Effect-friendly find.", import: "Array", name: "find" },
  findIndex: {
    description: "Effect-friendly findIndex.",
    import: "Array",
    name: "findIndex"
  },
  findLast: {
    description: "Effect-friendly findLast.",
    import: "Array",
    name: "findLast"
  },
  findLastIndex: {
    description: "Effect-friendly findLastIndex.",
    import: "Array",
    name: "findLastIndex"
  },
  flatMap: {
    description: "Effect-friendly flatMap.",
    import: "Array",
    name: "flatMap"
  },
  forEach: {
    description: "Effect-friendly forEach.",
    import: "Array",
    name: "forEach"
  },
  fromIterable: {
    description: "Effect-friendly fromIterable.",
    import: "Array",
    name: "fromIterable"
  },
  groupBy: {
    description: "Effect-friendly groupBy.",
    import: "Array",
    name: "groupBy"
  },
  includes: {
    description: "Effect-friendly includes.",
    import: "Array",
    name: "includes"
  },
  isEmptyArray: {
    description: "Effect-friendly isEmptyArray.",
    import: "Array",
    name: "isEmptyArray"
  },
  make: { description: "Effect-friendly make.", import: "Array", name: "make" },
  map: { description: "Effect-friendly map.", import: "Array", name: "map" },
  orderBy: {
    description: "Effect-friendly orderBy.",
    import: "Array",
    name: "orderBy"
  },
  partition: {
    description: "Effect-friendly partition.",
    import: "Array",
    name: "partition"
  },
  range: {
    description: "Effect-friendly range.",
    import: "Array",
    name: "range"
  },
  reduce: {
    description: "Effect-friendly reduce.",
    import: "Array",
    name: "reduce"
  },
  some: { description: "Effect-friendly some.", import: "Array", name: "some" },
  sortBy: {
    description: "Effect-friendly sortBy.",
    import: "Array",
    name: "sortBy"
  },
  uniq: { description: "Effect-friendly uniq.", import: "Array", name: "uniq" },
  uniqBy: {
    description: "Effect-friendly uniqBy.",
    import: "Array",
    name: "uniqBy"
  },
  zip: { description: "Effect-friendly zip.", import: "Array", name: "zip" }
} as const satisfies Record<
  string,
  {
    readonly description: string;
    readonly import: string;
    readonly name: string;
  }
>;

export type EffectApiMethodName = keyof typeof effectApi;

export const isEffectApiMethod = (
  name: string
): name is EffectApiMethodName => {
  return Object.hasOwn(effectApi, name);
};

export const effectCoreMethods = new Set<string>([
  "all",
  "allSuccesses",
  "annotateCurrentSpan",
  "catchAll",
  "catchTag",
  "catchTags",
  "die",
  "dieSync",
  "fail",
  "flatMap",
  "fn",
  "fnUntraced",
  "forEach",
  "gen",
  "interrupt",
  "log",
  "logDebug",
  "logError",
  "logInfo",
  "logWarning",
  "map",
  "orDie",
  "orElse",
  "orFail",
  "orSucceed",
  "provide",
  "provideService",
  "race",
  "service",
  "services",
  "sleep",
  "succeed",
  "sync",
  "tap",
  "tapError",
  "try",
  "tryPromise",
  "withSpan",
  "zip"
]);

export const isEffectCoreMethod = (name: string): boolean => {
  return effectCoreMethods.has(name);
};
