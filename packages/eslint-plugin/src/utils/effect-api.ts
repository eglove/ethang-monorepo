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
  allocate: {
    description: "Effect-friendly allocate.",
    import: "Array",
    name: "allocate"
  },
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
  intersperse: {
    description: "Effect-friendly intersperse.",
    import: "Array",
    name: "intersperse"
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
  reverse: {
    description: "Effect-friendly reverse.",
    import: "Array",
    name: "reverse"
  },
  scan: {
    description: "Effect-friendly scan.",
    import: "Array",
    name: "scan"
  },
  scanRight: {
    description: "Effect-friendly scanRight.",
    import: "Array",
    name: "scanRight"
  },
  some: { description: "Effect-friendly some.", import: "Array", name: "some" },
  sort: {
    description: "Effect-friendly sort.",
    import: "Array",
    name: "sort"
  },
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
  unzip: {
    description: "Effect-friendly unzip.",
    import: "Array",
    name: "unzip"
  },
  zip: { description: "Effect-friendly zip.", import: "Array", name: "zip" },
  zipWith: {
    description: "Effect-friendly zipWith.",
    import: "Array",
    name: "zipWith"
  }
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

// `effect/Predicate` namespace exports. The future `prefer-effect-predicate-*`
// rules will consume this table to drive their message suggestions. Keys are
// the bare function names as exported by the module (e.g. `isBigInt`); values
// capture the full `Predicate.<name>` import.
export const effectPredicateApi = {
  isBigInt: { import: "Predicate", name: "isBigInt" },
  isBoolean: { import: "Predicate", name: "isBoolean" },
  isDate: { import: "Predicate", name: "isDate" },
  isError: { import: "Predicate", name: "isError" },
  isFunction: { import: "Predicate", name: "isFunction" },
  isIterable: { import: "Predicate", name: "isIterable" },
  isMap: { import: "Predicate", name: "isMap" },
  isNotNullable: { import: "Predicate", name: "isNotNullable" },
  isNull: { import: "Predicate", name: "isNull" },
  isNullable: { import: "Predicate", name: "isNullable" },
  isNumber: { import: "Predicate", name: "isNumber" },
  isObject: { import: "Predicate", name: "isObject" },
  isPromise: { import: "Predicate", name: "isPromise" },
  isRecord: { import: "Predicate", name: "isRecord" },
  isSet: { import: "Predicate", name: "isSet" },
  isString: { import: "Predicate", name: "isString" },
  isSymbol: { import: "Predicate", name: "isSymbol" },
  isUndefined: { import: "Predicate", name: "isUndefined" }
} as const satisfies Record<
  string,
  { readonly import: string; readonly name: string }
>;

export type EffectPredicateApiName = keyof typeof effectPredicateApi;

export const isEffectPredicateApiName = (
  name: string
): name is EffectPredicateApiName => {
  return Object.hasOwn(effectPredicateApi, name);
};

// `effect/String` namespace exports. Keys are the bare function names; values
// are `{ import, name }` to match the `effectApi` shape.
export const effectStringApi = {
  endsWith: { import: "String", name: "endsWith" },
  includes: { import: "String", name: "includes" },
  isEmpty: { import: "String", name: "isEmpty" },
  isNonEmpty: { import: "String", name: "isNonEmpty" },
  split: { import: "String", name: "split" },
  startsWith: { import: "String", name: "startsWith" },
  toLowerCase: { import: "String", name: "toLowerCase" },
  toUpperCase: { import: "String", name: "toUpperCase" },
  trim: { import: "String", name: "trim" },
  trimEnd: { import: "String", name: "trimEnd" },
  trimStart: { import: "String", name: "trimStart" }
} as const satisfies Record<
  string,
  { readonly import: string; readonly name: string }
>;

export type EffectStringApiName = keyof typeof effectStringApi;

export const isEffectStringApiName = (
  name: string
): name is EffectStringApiName => {
  return Object.hasOwn(effectStringApi, name);
};

// `effect/Number` namespace exports.
export const effectNumberApi = {
  clamp: { import: "Number", name: "clamp" },
  isFinite: { import: "Number", name: "isFinite" },
  isInteger: { import: "Number", name: "isInteger" },
  isNaN: { import: "Number", name: "isNaN" },
  isSafeInteger: { import: "Number", name: "isSafeInteger" },
  parse: { import: "Number", name: "parse" },
  unsafeFromString: { import: "Number", name: "unsafeFromString" }
} as const satisfies Record<
  string,
  { readonly import: string; readonly name: string }
>;

export type EffectNumberApiName = keyof typeof effectNumberApi;

export const isEffectNumberApiName = (
  name: string
): name is EffectNumberApiName => {
  return Object.hasOwn(effectNumberApi, name);
};

// `effect/BigInt` namespace exports.
export const effectBigIntApi = {
  clamp: { import: "BigInt", name: "clamp" },
  fromString: { import: "BigInt", name: "fromString" },
  isBigInt: { import: "BigInt", name: "isBigInt" },
  make: { import: "BigInt", name: "make" },
  sign: { import: "BigInt", name: "sign" },
  unsafeFromString: { import: "BigInt", name: "unsafeFromString" }
} as const satisfies Record<
  string,
  { readonly import: string; readonly name: string }
>;

export type EffectBigIntApiName = keyof typeof effectBigIntApi;

export const isEffectBigIntApiName = (
  name: string
): name is EffectBigIntApiName => {
  return Object.hasOwn(effectBigIntApi, name);
};

// `effect/Encoding` namespace exports.
export const effectEncodingApi = {
  decodeBase64: { import: "Encoding", name: "decodeBase64" },
  decodeHex: { import: "Encoding", name: "decodeHex" },
  decodeUrl: { import: "Encoding", name: "decodeUrl" },
  encodeBase64: { import: "Encoding", name: "encodeBase64" },
  encodeBase64Url: { import: "Encoding", name: "encodeBase64Url" },
  encodeHex: { import: "Encoding", name: "encodeHex" },
  encodeUrl: { import: "Encoding", name: "encodeUrl" }
} as const satisfies Record<
  string,
  { readonly import: string; readonly name: string }
>;

export type EffectEncodingApiName = keyof typeof effectEncodingApi;

export const isEffectEncodingApiName = (
  name: string
): name is EffectEncodingApiName => {
  return Object.hasOwn(effectEncodingApi, name);
};

// `effect/Duration` namespace exports. The future
// `prefer-effect-duration-*` rules will read from this table.
export const effectDurationApi = {
  days: { import: "Duration", name: "days" },
  fromHours: { import: "Duration", name: "fromHours" },
  fromMillis: { import: "Duration", name: "fromMillis" },
  fromMinutes: { import: "Duration", name: "fromMinutes" },
  fromSeconds: { import: "Duration", name: "fromSeconds" },
  hours: { import: "Duration", name: "hours" },
  millis: { import: "Duration", name: "millis" },
  minutes: { import: "Duration", name: "minutes" },
  seconds: { import: "Duration", name: "seconds" },
  toHours: { import: "Duration", name: "toHours" },
  toMillis: { import: "Duration", name: "toMillis" },
  toMinutes: { import: "Duration", name: "toMinutes" },
  toSeconds: { import: "Duration", name: "toSeconds" }
} as const satisfies Record<
  string,
  { readonly import: string; readonly name: string }
>;

export type EffectDurationApiName = keyof typeof effectDurationApi;

export const isEffectDurationApiName = (
  name: string
): name is EffectDurationApiName => {
  return Object.hasOwn(effectDurationApi, name);
};

// `effect/Redacted` namespace exports. The `prefer-effect-redacted` rule is
// a heuristic (string-literal locals); this table gives it the import set.
export const effectRedactedApi = {
  make: { import: "Redacted", name: "make" },
  value: { import: "Redacted", name: "value" }
} as const satisfies Record<
  string,
  { readonly import: string; readonly name: string }
>;

export type EffectRedactedApiName = keyof typeof effectRedactedApi;

export const isEffectRedactedApiName = (
  name: string
): name is EffectRedactedApiName => {
  return Object.hasOwn(effectRedactedApi, name);
};
