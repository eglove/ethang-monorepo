// Map of native Array.prototype / Set / Map methods to the equivalent
// `effect` functions. The disambiguation logic in prefer-lodash consults
// this table to decide whether a CallExpression on a native receiver is
// already an Effect call (and should be left alone) or a true native array
// method that should be rewritten to a lodash deep import.
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

export const isEffectCoreMethod = (name: string) => {
  return effectCoreMethods.has(name);
};

// Map of native `Date` constructor, `Date.prototype` methods, and `Temporal`
// API surface to the closest `effect/DateTime` (or related) export. The new
// `prefer-effect-datetime` rule consults this table to drive its message
// suggestions; other future rules can reuse the table to disambiguate
// DateTime-shaped calls.
//
// Keys mirror the *unfamiliar* surface: "DateConstructor" for `new Date(...)`,
// the lowercase `Date.prototype` method names, and the PascalCase `Temporal.*`
// namespaces/types. Values identify the canonical Effect export to recommend.
export const effectDateTimeApi = {
  // `Date` static methods and the constructor itself.
  DateConstructor: {
    description: "Prefer Effect DateTime over the JavaScript Date constructor.",
    import: "DateTime",
    name: "make"
  },
  DateNow: {
    description: "Prefer `DateTime.now()` over `Date.now()`.",
    import: "DateTime",
    name: "now"
  },
  DateParse: {
    description: "Prefer `DateTime.make(string)` over `Date.parse(string)`.",
    import: "DateTime",
    name: "make"
  },
  DateReference: {
    description:
      "Prefer `DateTime.Utc` over the legacy `Date` global type/name.",
    import: "DateTime",
    name: "Utc"
  },
  DateUTC: {
    description:
      "Prefer `DateTime.unsafeMakeZoned({...})` over `Date.UTC(...)`.",
    import: "DateTime",
    name: "unsafeMakeZoned"
  },
  // `Date.prototype` methods → Effect `DateTime` pipeline helpers.
  getDate: {
    description:
      "Prefer `DateTime.toPartsUtc(date).day` over `date.getDate()`.",
    import: "DateTime",
    name: "toPartsUtc"
  },
  getDay: {
    description:
      "Prefer `DateTime.toPartsUtc(date).weekDay` over `date.getDay()` (0-6 → 1-7).",
    import: "DateTime",
    name: "toPartsUtc"
  },
  getFullYear: {
    description:
      "Prefer `DateTime.toPartsUtc(date).year` over `date.getFullYear()`.",
    import: "DateTime",
    name: "toPartsUtc"
  },
  getHours: {
    description:
      "Prefer `DateTime.toPartsUtc(date).hours` over `date.getHours()`.",
    import: "DateTime",
    name: "toPartsUtc"
  },
  getMilliseconds: {
    description:
      "Prefer `DateTime.toPartsUtc(date).milliseconds` over `date.getMilliseconds()`.",
    import: "DateTime",
    name: "toPartsUtc"
  },
  getMinutes: {
    description:
      "Prefer `DateTime.toPartsUtc(date).minutes` over `date.getMinutes()`.",
    import: "DateTime",
    name: "toPartsUtc"
  },
  getMonth: {
    description:
      "Prefer `DateTime.toPartsUtc(date).month` over `date.getMonth()` (Effect is 1-indexed).",
    import: "DateTime",
    name: "toPartsUtc"
  },
  getSeconds: {
    description:
      "Prefer `DateTime.toPartsUtc(date).seconds` over `date.getSeconds()`.",
    import: "DateTime",
    name: "toPartsUtc"
  },
  getTime: {
    description: "Prefer `DateTime.toEpochMillis(date)` over `date.getTime()`.",
    import: "DateTime",
    name: "toEpochMillis"
  },
  toISOString: {
    description: "Prefer `DateTime.formatIso(date)` over `date.toISOString()`.",
    import: "DateTime",
    name: "formatIso"
  },
  toJSON: {
    description: "Prefer `DateTime.formatIso(date)` over `date.toJSON()`.",
    import: "DateTime",
    name: "formatIso"
  },
  // `Temporal.*` namespace → Effect DateTime. The trailing segment is what
  // is suggested; the namespace is captured by the rule from the source.
  TemporalCalendar: {
    description:
      "Use `DateTime` with explicit calendar handling instead of `Temporal.Calendar`.",
    import: "DateTime",
    name: "makeZoned"
  },
  TemporalDuration: {
    description: "Use `effect/Duration` instead of `Temporal.Duration`.",
    import: "Duration",
    name: "millis"
  },
  TemporalInstant: {
    description:
      "Prefer `DateTime.unsafeFromEpochMilliseconds(ms)` or `.makeZoned(...)` over `Temporal.Instant`.",
    import: "DateTime",
    name: "unsafeFromEpochMilliseconds"
  },
  TemporalNow: {
    description: "Prefer `DateTime.now()` over `Temporal.Now.instant()`.",
    import: "DateTime",
    name: "now"
  },
  TemporalPlainDate: {
    description:
      "Prefer `DateTime.unsafeMake({year, month, day})` over `Temporal.PlainDate`.",
    import: "DateTime",
    name: "unsafeMake"
  },
  TemporalPlainDateTime: {
    description:
      "Prefer `DateTime.unsafeMake({...})` over `Temporal.PlainDateTime`.",
    import: "DateTime",
    name: "unsafeMake"
  },
  TemporalPlainTime: {
    description:
      "Prefer `DateTime` over `Temporal.PlainTime` (no direct equivalent; consider whether you need a date).",
    import: "DateTime",
    name: "unsafeMake"
  },
  TemporalTimeZone: {
    description:
      "Use `DateTime.TimeZone.Named` instead of `Temporal.TimeZone`.",
    import: "DateTime",
    name: "TimeZone.Named"
  },
  TemporalZonedDateTime: {
    description:
      "Prefer `DateTime.unsafeMakeZoned(input, { timeZone })` over `Temporal.ZonedDateTime`.",
    import: "DateTime",
    name: "unsafeMakeZoned"
  }
} as const satisfies Record<
  string,
  {
    readonly description: string;
    readonly import: string;
    readonly name: string;
  }
>;

export type EffectDateTimeApiKey = keyof typeof effectDateTimeApi;

export const isEffectDateTimeApiKey = (
  name: string
): name is EffectDateTimeApiKey => {
  return Object.hasOwn(effectDateTimeApi, name);
};
