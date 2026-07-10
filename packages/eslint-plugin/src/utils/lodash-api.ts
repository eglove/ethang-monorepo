// Full lodash API surface. The map key is the canonical lodash function name
// (matching the file name under `lodash/<name>.js`). The value describes the
// equivalent Array.prototype / Object / String / Number API that the rule
// uses to detect when a native call can be replaced with a lodash call.
//
// The categories are used to decide which side of the "Effect first, lodash
// second" precedence layer a particular replacement belongs to. `effect` means
// there is no first-class lodash equivalent that Effect also covers, and
// `neither` means lodash is the better fit.
export type LodashApiCategory =
  | "array"
  | "chain"
  | "collection"
  | "date"
  | "function"
  | "lang"
  | "math"
  | "number"
  | "object"
  | "seq"
  | "string"
  | "util";

export type LodashApiEntry = {
  readonly category: LodashApiCategory;
  readonly description: string;
  readonly nativeAliases: readonly string[];
};

export const lodashApi = {
  // Array
  chunk: {
    category: "array",
    description: "Splits an array into chunks of a given size.",
    nativeAliases: []
  },
  compact: {
    category: "array",
    description: "Removes falsy values from an array.",
    nativeAliases: ["Array.prototype.filter"]
  },
  concat: {
    category: "array",
    description: "Concatenates arrays.",
    nativeAliases: []
  },
  difference: {
    category: "array",
    description: "Returns values from the first array not present in the rest.",
    nativeAliases: []
  },
  differenceBy: {
    category: "array",
    description: "Like difference but invokes iteratee on each element.",
    nativeAliases: []
  },
  differenceWith: {
    category: "array",
    description: "Like difference but uses a comparator.",
    nativeAliases: []
  },
  drop: {
    category: "array",
    description: "Drops the first n elements.",
    nativeAliases: ["Array.prototype.slice"]
  },
  dropRight: {
    category: "array",
    description: "Drops the last n elements.",
    nativeAliases: ["Array.prototype.slice"]
  },
  dropRightWhile: {
    category: "array",
    description: "Drops trailing elements while predicate returns truthy.",
    nativeAliases: []
  },
  dropWhile: {
    category: "array",
    description: "Drops leading elements while predicate returns truthy.",
    nativeAliases: []
  },
  fill: {
    category: "array",
    description: "Fills elements of an array with a value.",
    nativeAliases: ["Array.prototype.fill"]
  },
  findIndex: {
    category: "array",
    description:
      "Returns the index of the first element predicate returns truthy for.",
    nativeAliases: ["Array.prototype.findIndex"]
  },
  findLastIndex: {
    category: "array",
    description: "Like findIndex but iterates from the end.",
    nativeAliases: []
  },
  first: {
    category: "array",
    description: "Returns the first element.",
    nativeAliases: ["Array.prototype.at"]
  },
  flatten: {
    category: "array",
    description: "Flattens an array one level deep.",
    nativeAliases: ["Array.prototype.flat"]
  },
  flattenDeep: {
    category: "array",
    description: "Recursively flattens an array.",
    nativeAliases: ["Array.prototype.flat"]
  },
  flattenDepth: {
    category: "array",
    description: "Flattens an array up to depth.",
    nativeAliases: ["Array.prototype.flat"]
  },
  fromPairs: {
    category: "array",
    description: "Builds an object from key-value pairs.",
    nativeAliases: ["Object.fromEntries"]
  },
  head: {
    category: "array",
    description: "Returns the first element.",
    nativeAliases: ["Array.prototype.at"]
  },
  indexOf: {
    category: "array",
    description: "Returns the first index of a value, or -1.",
    nativeAliases: ["Array.prototype.indexOf"]
  },
  initial: {
    category: "array",
    description: "Returns all but the last element.",
    nativeAliases: ["Array.prototype.slice"]
  },
  intersection: {
    category: "array",
    description: "Returns the intersection of arrays.",
    nativeAliases: []
  },
  intersectionBy: {
    category: "array",
    description: "Like intersection but invokes iteratee on each element.",
    nativeAliases: []
  },
  intersectionWith: {
    category: "array",
    description: "Like intersection but uses a comparator.",
    nativeAliases: []
  },
  join: {
    category: "array",
    description: "Joins array elements into a string.",
    nativeAliases: ["Array.prototype.join"]
  },
  last: {
    category: "array",
    description: "Returns the last element.",
    nativeAliases: ["Array.prototype.at"]
  },
  lastIndexOf: {
    category: "array",
    description: "Returns the last index of a value, or -1.",
    nativeAliases: ["Array.prototype.lastIndexOf"]
  },
  nth: {
    category: "array",
    description: "Returns the nth element of an array.",
    nativeAliases: ["Array.prototype.at"]
  },
  pull: {
    category: "array",
    description: "Removes given values from the array in place.",
    nativeAliases: []
  },
  pullAll: {
    category: "array",
    description: "Removes all given values from the array in place.",
    nativeAliases: []
  },
  pullAllBy: {
    category: "array",
    description: "Like pullAll but invokes iteratee on each element.",
    nativeAliases: []
  },
  pullAllWith: {
    category: "array",
    description: "Like pullAll but uses a comparator.",
    nativeAliases: []
  },
  pullAt: {
    category: "array",
    description: "Removes elements at specified indices in place.",
    nativeAliases: []
  },
  remove: {
    category: "array",
    description:
      "Removes elements for which predicate returns truthy, in place.",
    nativeAliases: []
  },
  reverse: {
    category: "array",
    description: "Reverses an array in place.",
    nativeAliases: ["Array.prototype.reverse"]
  },
  slice: {
    category: "array",
    description: "Returns a slice of an array.",
    nativeAliases: ["Array.prototype.slice"]
  },
  sortedIndex: {
    category: "array",
    description:
      "Returns the index at which value should be inserted to keep sort order.",
    nativeAliases: []
  },
  sortedIndexBy: {
    category: "array",
    description: "Like sortedIndex but invokes iteratee on each element.",
    nativeAliases: []
  },
  sortedIndexOf: {
    category: "array",
    description: "Like indexOf but uses a sorted binary search.",
    nativeAliases: []
  },
  sortedLastIndex: {
    category: "array",
    description: "Like sortedIndex but for the end position.",
    nativeAliases: []
  },
  sortedLastIndexBy: {
    category: "array",
    description: "Like sortedIndexBy but for the end position.",
    nativeAliases: []
  },
  sortedLastIndexOf: {
    category: "array",
    description: "Like lastIndexOf but uses a sorted binary search.",
    nativeAliases: []
  },
  sortedUniq: {
    category: "array",
    description: "Returns the unique sorted array.",
    nativeAliases: []
  },
  sortedUniqBy: {
    category: "array",
    description: "Like sortedUniq but invokes iteratee on each element.",
    nativeAliases: []
  },
  tail: {
    category: "array",
    description: "Returns all but the first element.",
    nativeAliases: ["Array.prototype.slice"]
  },
  take: {
    category: "array",
    description: "Returns the first n elements.",
    nativeAliases: ["Array.prototype.slice"]
  },
  takeRight: {
    category: "array",
    description: "Returns the last n elements.",
    nativeAliases: ["Array.prototype.slice"]
  },
  takeRightWhile: {
    category: "array",
    description: "Takes from the end while predicate returns truthy.",
    nativeAliases: []
  },
  takeWhile: {
    category: "array",
    description: "Takes from the start while predicate returns truthy.",
    nativeAliases: []
  },
  union: {
    category: "array",
    description: "Returns the union of arrays.",
    nativeAliases: []
  },
  unionBy: {
    category: "array",
    description: "Like union but invokes iteratee on each element.",
    nativeAliases: []
  },
  unionWith: {
    category: "array",
    description: "Like union but uses a comparator.",
    nativeAliases: []
  },
  uniq: {
    category: "array",
    description: "Returns a duplicate-free version of the array.",
    nativeAliases: ["Array.prototype.filter"]
  },
  uniqBy: {
    category: "array",
    description: "Like uniq but invokes iteratee on each element.",
    nativeAliases: []
  },
  uniqWith: {
    category: "array",
    description: "Like uniq but uses a comparator.",
    nativeAliases: []
  },
  unzip: {
    category: "array",
    description: "Inverse of zip.",
    nativeAliases: []
  },
  unzipWith: {
    category: "array",
    description: "Like unzip but invokes iteratee on regrouped elements.",
    nativeAliases: []
  },
  without: {
    category: "array",
    description: "Returns an array excluding all given values.",
    nativeAliases: []
  },
  xor: {
    category: "array",
    description: "Returns the symmetric difference of arrays.",
    nativeAliases: []
  },
  xorBy: {
    category: "array",
    description: "Like xor but invokes iteratee on each element.",
    nativeAliases: []
  },
  xorWith: {
    category: "array",
    description: "Like xor but uses a comparator.",
    nativeAliases: []
  },
  zip: {
    category: "array",
    description: "Creates an array of grouped elements.",
    nativeAliases: []
  },
  zipObject: {
    category: "array",
    description: "Creates an object from two arrays of keys and values.",
    nativeAliases: []
  },
  zipObjectDeep: {
    category: "array",
    description: "Like zipObject but supports nested paths.",
    nativeAliases: []
  },
  zipWith: {
    category: "array",
    description: "Like zip but invokes iteratee on grouped elements.",
    nativeAliases: []
  },

  // Collection
  countBy: {
    category: "collection",
    description: "Counts occurrences of values produced by iteratee.",
    nativeAliases: []
  },
  each: {
    category: "collection",
    description: "Iterates over a collection.",
    nativeAliases: ["Array.prototype.forEach"]
  },
  eachRight: {
    category: "collection",
    description: "Like each but iterates from the end.",
    nativeAliases: []
  },
  every: {
    category: "collection",
    description: "Checks if predicate returns truthy for all elements.",
    nativeAliases: ["Array.prototype.every"]
  },
  filter: {
    category: "collection",
    description: "Filters elements by predicate.",
    nativeAliases: ["Array.prototype.filter"]
  },
  find: {
    category: "collection",
    description: "Returns the first element predicate returns truthy for.",
    nativeAliases: ["Array.prototype.find"]
  },
  findLast: {
    category: "collection",
    description: "Like find but iterates from the end.",
    nativeAliases: ["Array.prototype.findLast"]
  },
  flatMap: {
    category: "collection",
    description: "Maps and flattens.",
    nativeAliases: ["Array.prototype.flatMap"]
  },
  flatMapDeep: {
    category: "collection",
    description: "Maps and recursively flattens.",
    nativeAliases: ["Array.prototype.flatMap"]
  },
  flatMapDepth: {
    category: "collection",
    description: "Maps and flattens up to depth.",
    nativeAliases: ["Array.prototype.flatMap"]
  },
  forEach: {
    category: "collection",
    description: "Iterates over a collection.",
    nativeAliases: ["Array.prototype.forEach"]
  },
  forEachRight: {
    category: "collection",
    description: "Like forEach but iterates from the end.",
    nativeAliases: []
  },
  groupBy: {
    category: "collection",
    description: "Groups elements by the result of iteratee.",
    nativeAliases: []
  },
  includes: {
    category: "collection",
    description: "Checks if value is in collection.",
    nativeAliases: ["Array.prototype.includes"]
  },
  invokeMap: {
    category: "collection",
    description: "Invokes method at path on each element.",
    nativeAliases: []
  },
  keyBy: {
    category: "collection",
    description: "Creates an object keyed by the result of iteratee.",
    nativeAliases: []
  },
  map: {
    category: "collection",
    description: "Maps each element through iteratee.",
    nativeAliases: ["Array.prototype.map"]
  },
  orderBy: {
    category: "collection",
    description: "Like sortBy but supports multiple sort orders.",
    nativeAliases: []
  },
  partition: {
    category: "collection",
    description: "Splits into two groups: truthy and falsy predicate results.",
    nativeAliases: []
  },
  reduce: {
    category: "collection",
    description: "Reduces a collection to a value.",
    nativeAliases: ["Array.prototype.reduce"]
  },
  reduceRight: {
    category: "collection",
    description: "Like reduce but iterates from the end.",
    nativeAliases: ["Array.prototype.reduceRight"]
  },
  reject: {
    category: "collection",
    description: "Opposite of filter.",
    nativeAliases: []
  },
  sample: {
    category: "collection",
    description: "Returns a random element.",
    nativeAliases: []
  },
  sampleSize: {
    category: "collection",
    description: "Returns n random elements.",
    nativeAliases: []
  },
  shuffle: {
    category: "collection",
    description: "Returns a shuffled copy of the collection.",
    nativeAliases: []
  },
  size: {
    category: "collection",
    description: "Returns the size of a collection.",
    nativeAliases: []
  },
  some: {
    category: "collection",
    description: "Checks if predicate returns truthy for any element.",
    nativeAliases: ["Array.prototype.some"]
  },
  sortBy: {
    category: "collection",
    description: "Sorts by the result of iteratee.",
    nativeAliases: ["Array.prototype.sort"]
  },

  // Object
  assign: {
    category: "object",
    description: "Assigns own enumerable properties.",
    nativeAliases: ["Object.assign"]
  },
  assignIn: {
    category: "object",
    description: "Like assign but includes inherited properties.",
    nativeAliases: []
  },
  assignInWith: {
    category: "object",
    description: "Like assignIn but uses a customizer.",
    nativeAliases: []
  },
  assignWith: {
    category: "object",
    description: "Like assign but uses a customizer.",
    nativeAliases: []
  },
  at: {
    category: "object",
    description: "Creates an array of values at specified paths.",
    nativeAliases: []
  },
  create: {
    category: "object",
    description: "Creates an object that inherits from prototype.",
    nativeAliases: []
  },
  defaults: {
    category: "object",
    description:
      "Assigns own and inherited enumerable string keyed properties for undefined destinations.",
    nativeAliases: []
  },
  defaultsDeep: {
    category: "object",
    description: "Like defaults but recursively.",
    nativeAliases: []
  },
  findKey: {
    category: "object",
    description:
      "Returns the key of the first element predicate returns truthy for.",
    nativeAliases: []
  },
  findLastKey: {
    category: "object",
    description: "Like findKey but iterates from the end.",
    nativeAliases: []
  },
  forIn: {
    category: "object",
    description:
      "Iterates over own and inherited enumerable string keyed properties.",
    nativeAliases: []
  },
  forOwn: {
    category: "object",
    description: "Iterates over own enumerable string keyed properties.",
    nativeAliases: []
  },
  functions: {
    category: "object",
    description: "Returns an array of function property names.",
    nativeAliases: []
  },
  functionsIn: {
    category: "object",
    description: "Like functions but includes inherited properties.",
    nativeAliases: []
  },
  get: {
    category: "object",
    description: "Gets the value at path of object.",
    nativeAliases: []
  },
  has: {
    category: "object",
    description: "Checks if path is a direct property of object.",
    nativeAliases: ["Object.hasOwn"]
  },
  hasIn: {
    category: "object",
    description: "Checks if path is an inherited property of object.",
    nativeAliases: []
  },
  invert: {
    category: "object",
    description: "Creates an object with inverted keys and values.",
    nativeAliases: []
  },
  invertBy: {
    category: "object",
    description: "Like invert but accepts iteratee for values.",
    nativeAliases: []
  },
  invoke: {
    category: "object",
    description: "Invokes the method at path on object.",
    nativeAliases: []
  },
  keys: {
    category: "object",
    description: "Returns the names of own enumerable string keyed properties.",
    nativeAliases: ["Object.keys"]
  },
  keysIn: {
    category: "object",
    description: "Like keys but includes inherited properties.",
    nativeAliases: []
  },
  mapKeys: {
    category: "object",
    description: "Maps keys through iteratee.",
    nativeAliases: []
  },
  mapValues: {
    category: "object",
    description: "Maps values through iteratee.",
    nativeAliases: []
  },
  merge: {
    category: "object",
    description:
      "Recursively merges own and inherited enumerable string keyed properties.",
    nativeAliases: []
  },
  mergeWith: {
    category: "object",
    description: "Like merge but uses a customizer.",
    nativeAliases: []
  },
  omit: {
    category: "object",
    description: "Omits the specified properties.",
    nativeAliases: []
  },
  omitBy: {
    category: "object",
    description: "Omits properties for which predicate returns truthy.",
    nativeAliases: []
  },
  pick: {
    category: "object",
    description: "Picks the specified properties.",
    nativeAliases: []
  },
  pickBy: {
    category: "object",
    description: "Picks properties for which predicate returns truthy.",
    nativeAliases: []
  },
  result: {
    category: "object",
    description: "Returns the result of invoking the method at path.",
    nativeAliases: []
  },
  set: {
    category: "object",
    description: "Sets the value at path of object.",
    nativeAliases: []
  },
  setWith: {
    category: "object",
    description: "Like set but uses a customizer.",
    nativeAliases: []
  },
  toPairs: {
    category: "object",
    description: "Creates an array of own enumerable string keyed-value pairs.",
    nativeAliases: ["Object.entries"]
  },
  toPairsIn: {
    category: "object",
    description: "Like toPairs but includes inherited properties.",
    nativeAliases: []
  },
  transform: {
    category: "object",
    description: "Transforms using accumulator.",
    nativeAliases: []
  },
  unset: {
    category: "object",
    description: "Removes the property at path.",
    nativeAliases: []
  },
  update: {
    category: "object",
    description: "Updates the value at path with updater.",
    nativeAliases: []
  },
  updateWith: {
    category: "object",
    description: "Like update but uses a customizer.",
    nativeAliases: []
  },
  values: {
    category: "object",
    description:
      "Returns the values of own enumerable string keyed properties.",
    nativeAliases: ["Object.values"]
  },
  valuesIn: {
    category: "object",
    description: "Like values but includes inherited properties.",
    nativeAliases: []
  },

  // String
  camelCase: {
    category: "string",
    description: "Converts string to camelCase.",
    nativeAliases: []
  },
  capitalize: {
    category: "string",
    description: "Capitalizes the first character.",
    nativeAliases: []
  },
  deburr: {
    category: "string",
    description:
      "Deburrs a string by converting Latin-1 Supplement and Latin Extended-A letters.",
    nativeAliases: []
  },
  endsWith: {
    category: "string",
    description: "Checks if string ends with target.",
    nativeAliases: ["String.prototype.endsWith"]
  },
  escape: {
    category: "string",
    description: "Escapes HTML entities.",
    nativeAliases: []
  },
  escapeRegExp: {
    category: "string",
    description: "Escapes RegExp special characters.",
    nativeAliases: []
  },
  kebabCase: {
    category: "string",
    description: "Converts string to kebab-case.",
    nativeAliases: []
  },
  lowerCase: {
    category: "string",
    description: "Converts string to lower case.",
    nativeAliases: ["String.prototype.toLowerCase"]
  },
  lowerFirst: {
    category: "string",
    description: "Lowercases the first character.",
    nativeAliases: []
  },
  pad: {
    category: "string",
    description: "Pads string on both sides.",
    nativeAliases: []
  },
  padEnd: {
    category: "string",
    description: "Pads string on the right.",
    nativeAliases: ["String.prototype.padEnd"]
  },
  padStart: {
    category: "string",
    description: "Pads string on the left.",
    nativeAliases: ["String.prototype.padStart"]
  },
  parseInt: {
    category: "string",
    description: "Parses a string into an integer of the specified radix.",
    nativeAliases: []
  },
  repeat: {
    category: "string",
    description: "Repeats string n times.",
    nativeAliases: ["String.prototype.repeat"]
  },
  replace: {
    category: "string",
    description: "Replaces matches with replacement.",
    nativeAliases: ["String.prototype.replace"]
  },
  snakeCase: {
    category: "string",
    description: "Converts string to snake_case.",
    nativeAliases: []
  },
  split: {
    category: "string",
    description: "Splits string by separator.",
    nativeAliases: ["String.prototype.split"]
  },
  startCase: {
    category: "string",
    description: "Converts string to Start Case.",
    nativeAliases: []
  },
  startsWith: {
    category: "string",
    description: "Checks if string starts with target.",
    nativeAliases: ["String.prototype.startsWith"]
  },
  template: {
    category: "string",
    description: "Compiles a template into a function.",
    nativeAliases: []
  },
  toLower: {
    category: "string",
    description: "Lowercases the entire string.",
    nativeAliases: ["String.prototype.toLowerCase"]
  },
  toUpper: {
    category: "string",
    description: "Uppercases the entire string.",
    nativeAliases: ["String.prototype.toUpperCase"]
  },
  trim: {
    category: "string",
    description: "Trims whitespace from both ends.",
    nativeAliases: ["String.prototype.trim"]
  },
  trimEnd: {
    category: "string",
    description: "Trims whitespace from the end.",
    nativeAliases: ["String.prototype.trimEnd"]
  },
  trimStart: {
    category: "string",
    description: "Trims whitespace from the start.",
    nativeAliases: ["String.prototype.trimStart"]
  },
  truncate: {
    category: "string",
    description: "Truncates string if longer than length.",
    nativeAliases: []
  },
  unescape: {
    category: "string",
    description: "Unescapes HTML entities.",
    nativeAliases: []
  },
  upperCase: {
    category: "string",
    description: "Converts string to upper case.",
    nativeAliases: ["String.prototype.toUpperCase"]
  },
  upperFirst: {
    category: "string",
    description: "Uppercases the first character.",
    nativeAliases: []
  },
  words: {
    category: "string",
    description: "Splits string into an array of words.",
    nativeAliases: []
  },

  // Number
  clamp: {
    category: "number",
    description: "Clamps number within bounds.",
    nativeAliases: []
  },
  inRange: {
    category: "number",
    description: "Checks if n is between start and end.",
    nativeAliases: []
  },
  random: {
    category: "number",
    description: "Returns a random number in range.",
    nativeAliases: []
  },
  range: {
    category: "number",
    description: "Returns an array of numbers from start to end.",
    nativeAliases: []
  },

  // Lang
  castArray: {
    category: "lang",
    description: "Casts value to an array if it isn't one.",
    nativeAliases: []
  },
  clone: {
    category: "lang",
    description: "Shallow clones value.",
    nativeAliases: []
  },
  cloneDeep: {
    category: "lang",
    description: "Deep clones value.",
    nativeAliases: ["structuredClone"]
  },
  cloneDeepWith: {
    category: "lang",
    description: "Like cloneDeep but uses a customizer.",
    nativeAliases: []
  },
  cloneWith: {
    category: "lang",
    description: "Like clone but uses a customizer.",
    nativeAliases: []
  },
  conformsTo: {
    category: "lang",
    description:
      "Checks if object conforms to source by invoking predicate functions.",
    nativeAliases: []
  },
  eq: {
    category: "lang",
    description: "SameValueZero equality.",
    nativeAliases: []
  },
  gt: { category: "lang", description: "Greater than.", nativeAliases: [] },
  gte: {
    category: "lang",
    description: "Greater than or equal.",
    nativeAliases: []
  },
  isArguments: {
    category: "lang",
    description: "Checks if value is an arguments object.",
    nativeAliases: []
  },
  isArray: {
    category: "lang",
    description: "Checks if value is an Array.",
    nativeAliases: ["Array.isArray"]
  },
  isArrayBuffer: {
    category: "lang",
    description: "Checks if value is an ArrayBuffer.",
    nativeAliases: []
  },
  isArrayLike: {
    category: "lang",
    description: "Checks if value is array-like.",
    nativeAliases: []
  },
  isArrayLikeObject: {
    category: "lang",
    description: "Checks if value is an array-like object.",
    nativeAliases: []
  },
  isBoolean: {
    category: "lang",
    description: "Checks if value is a boolean.",
    nativeAliases: []
  },
  isBuffer: {
    category: "lang",
    description: "Checks if value is a Buffer.",
    nativeAliases: []
  },
  isDate: {
    category: "lang",
    description: "Checks if value is a Date.",
    nativeAliases: []
  },
  isElement: {
    category: "lang",
    description: "Checks if value is a DOM element.",
    nativeAliases: []
  },
  isEmpty: {
    category: "lang",
    description: "Checks if value is empty.",
    nativeAliases: []
  },
  isEqual: {
    category: "lang",
    description: "Deep equality check.",
    nativeAliases: []
  },
  isEqualWith: {
    category: "lang",
    description: "Like isEqual but uses a customizer.",
    nativeAliases: []
  },
  isError: {
    category: "lang",
    description: "Checks if value is an Error.",
    nativeAliases: []
  },
  isFinite: {
    category: "lang",
    description: "Checks if value is a finite number.",
    nativeAliases: ["Number.isFinite"]
  },
  isFunction: {
    category: "lang",
    description: "Checks if value is a function.",
    nativeAliases: []
  },
  isInteger: {
    category: "lang",
    description: "Checks if value is an integer.",
    nativeAliases: ["Number.isInteger"]
  },
  isLength: {
    category: "lang",
    description: "Checks if value is a valid array-like length.",
    nativeAliases: []
  },
  isMap: {
    category: "lang",
    description: "Checks if value is a Map.",
    nativeAliases: []
  },
  isMatch: {
    category: "lang",
    description: "Performs a deep comparison between object and source.",
    nativeAliases: []
  },
  isMatchWith: {
    category: "lang",
    description: "Like isMatch but uses a customizer.",
    nativeAliases: []
  },
  isNaN: {
    category: "lang",
    description: "Checks if value is NaN.",
    nativeAliases: ["Number.isNaN"]
  },
  isNative: {
    category: "lang",
    description: "Checks if value is a native function.",
    nativeAliases: []
  },
  isNil: {
    category: "lang",
    description: "Checks if value is null or undefined.",
    nativeAliases: []
  },
  isNull: {
    category: "lang",
    description: "Checks if value is null.",
    nativeAliases: []
  },
  isNumber: {
    category: "lang",
    description: "Checks if value is a number.",
    nativeAliases: []
  },
  isObject: {
    category: "lang",
    description: "Checks if value is an object (typeof or function).",
    nativeAliases: []
  },
  isObjectLike: {
    category: "lang",
    description: "Checks if value is object-like.",
    nativeAliases: []
  },
  isPlainObject: {
    category: "lang",
    description: "Checks if value is a plain object.",
    nativeAliases: []
  },
  isRegExp: {
    category: "lang",
    description: "Checks if value is a RegExp.",
    nativeAliases: []
  },
  isSafeInteger: {
    category: "lang",
    description: "Checks if value is a safe integer.",
    nativeAliases: ["Number.isSafeInteger"]
  },
  isSet: {
    category: "lang",
    description: "Checks if value is a Set.",
    nativeAliases: []
  },
  isString: {
    category: "lang",
    description: "Checks if value is a string.",
    nativeAliases: []
  },
  isSymbol: {
    category: "lang",
    description: "Checks if value is a symbol.",
    nativeAliases: []
  },
  isTypedArray: {
    category: "lang",
    description: "Checks if value is a typed array.",
    nativeAliases: []
  },
  isUndefined: {
    category: "lang",
    description: "Checks if value is undefined.",
    nativeAliases: []
  },
  isWeakMap: {
    category: "lang",
    description: "Checks if value is a WeakMap.",
    nativeAliases: []
  },
  isWeakSet: {
    category: "lang",
    description: "Checks if value is a WeakSet.",
    nativeAliases: []
  },
  lt: { category: "lang", description: "Less than.", nativeAliases: [] },
  lte: {
    category: "lang",
    description: "Less than or equal.",
    nativeAliases: []
  },
  toArray: {
    category: "lang",
    description: "Converts value to an array.",
    nativeAliases: []
  },
  toFinite: {
    category: "lang",
    description: "Converts value to a finite number.",
    nativeAliases: []
  },
  toInteger: {
    category: "lang",
    description: "Converts value to an integer.",
    nativeAliases: []
  },
  toIterator: {
    category: "lang",
    description: "Converts value to an iterator.",
    nativeAliases: []
  },
  toLength: {
    category: "lang",
    description: "Converts value to an integer suitable for use as a length.",
    nativeAliases: []
  },
  toNumber: {
    category: "lang",
    description: "Converts value to a number.",
    nativeAliases: []
  },
  toPlainObject: {
    category: "lang",
    description: "Converts value to a plain object.",
    nativeAliases: []
  },
  toSafeInteger: {
    category: "lang",
    description: "Converts value to a safe integer.",
    nativeAliases: []
  },
  toString: {
    category: "lang",
    description: "Converts value to a string.",
    nativeAliases: []
  },

  // Math
  add: {
    category: "math",
    description: "Adds two numbers.",
    nativeAliases: []
  },
  ceil: {
    category: "math",
    description: "Ceiling of a number.",
    nativeAliases: ["Math.ceil"]
  },
  divide: {
    category: "math",
    description: "Divides two numbers.",
    nativeAliases: []
  },
  floor: {
    category: "math",
    description: "Floor of a number.",
    nativeAliases: ["Math.floor"]
  },
  max: {
    category: "math",
    description: "Returns the maximum value.",
    nativeAliases: ["Math.max"]
  },
  maxBy: {
    category: "math",
    description: "Returns the maximum by iteratee.",
    nativeAliases: []
  },
  mean: {
    category: "math",
    description: "Returns the arithmetic mean.",
    nativeAliases: []
  },
  meanBy: {
    category: "math",
    description: "Like mean but applies iteratee first.",
    nativeAliases: []
  },
  min: {
    category: "math",
    description: "Returns the minimum value.",
    nativeAliases: ["Math.min"]
  },
  minBy: {
    category: "math",
    description: "Returns the minimum by iteratee.",
    nativeAliases: []
  },
  multiply: {
    category: "math",
    description: "Multiplies two numbers.",
    nativeAliases: []
  },
  round: {
    category: "math",
    description: "Rounds a number to the nearest integer.",
    nativeAliases: ["Math.round"]
  },
  subtract: {
    category: "math",
    description: "Subtracts two numbers.",
    nativeAliases: []
  },
  sum: {
    category: "math",
    description: "Returns the sum of a collection.",
    nativeAliases: []
  },
  sumBy: {
    category: "math",
    description: "Like sum but applies iteratee first.",
    nativeAliases: []
  },

  // Function
  after: {
    category: "function",
    description: "Creates a function that invokes once it's called n times.",
    nativeAliases: []
  },
  ary: {
    category: "function",
    description: "Creates a function that caps the number of arguments.",
    nativeAliases: []
  },
  before: {
    category: "function",
    description: "Creates a function that invokes at most n times.",
    nativeAliases: []
  },
  bind: {
    category: "function",
    description: "Creates a function that invokes with this binding.",
    nativeAliases: []
  },
  bindKey: {
    category: "function",
    description: "Like bind but with a key on object.",
    nativeAliases: []
  },
  curry: {
    category: "function",
    description: "Creates a curried function.",
    nativeAliases: []
  },
  curryRight: {
    category: "function",
    description: "Like curry but curries from the right.",
    nativeAliases: []
  },
  debounce: {
    category: "function",
    description: "Creates a debounced function.",
    nativeAliases: []
  },
  defer: {
    category: "function",
    description: "Defers invoking func until the current call stack clears.",
    nativeAliases: []
  },
  delay: {
    category: "function",
    description: "Invokes func after wait milliseconds.",
    nativeAliases: []
  },
  flip: {
    category: "function",
    description: "Creates a function with flipped arguments.",
    nativeAliases: []
  },
  memoize: {
    category: "function",
    description: "Creates a memoized function.",
    nativeAliases: []
  },
  negate: {
    category: "function",
    description: "Creates a negated predicate.",
    nativeAliases: []
  },
  once: {
    category: "function",
    description: "Creates a function that is restricted to invoking func once.",
    nativeAliases: []
  },
  overArgs: {
    category: "function",
    description: "Creates a function that transforms arguments.",
    nativeAliases: []
  },
  partial: {
    category: "function",
    description: "Creates a function with partially applied arguments.",
    nativeAliases: []
  },
  partialRight: {
    category: "function",
    description: "Like partial but applies from the right.",
    nativeAliases: []
  },
  rearg: {
    category: "function",
    description: "Creates a function that reorders arguments.",
    nativeAliases: []
  },
  rest: {
    category: "function",
    description: "Creates a function that captures the rest of the arguments.",
    nativeAliases: []
  },
  spread: {
    category: "function",
    description: "Like rest but spreads them into func.",
    nativeAliases: []
  },
  throttle: {
    category: "function",
    description: "Creates a throttled function.",
    nativeAliases: []
  },
  unary: {
    category: "function",
    description: "Caps a function to one argument.",
    nativeAliases: []
  },
  wrap: {
    category: "function",
    description: "Wraps a function inside a wrapper.",
    nativeAliases: []
  },

  // Seq
  chain: {
    category: "seq",
    description: "Creates a lodash wrapper instance.",
    nativeAliases: []
  },
  tap: {
    category: "seq",
    description: "Invokes interceptor with the value and returns the value.",
    nativeAliases: []
  },
  thru: {
    category: "seq",
    description: "Like tap but returns the result of interceptor.",
    nativeAliases: []
  },
  toChain: {
    category: "seq",
    description: "Converts a wrapped value to a chainable sequence.",
    nativeAliases: []
  },

  // Util
  cond: {
    category: "util",
    description: "Creates a function that iterates over pairs.",
    nativeAliases: []
  },
  conforms: {
    category: "util",
    description:
      "Creates a function that invokes predicate property functions.",
    nativeAliases: []
  },
  constant: {
    category: "util",
    description: "Creates a function that returns value.",
    nativeAliases: []
  },
  defaultTo: {
    category: "util",
    description: "Returns default for nullish values.",
    nativeAliases: []
  },
  flow: {
    category: "util",
    description: "Composes functions left-to-right.",
    nativeAliases: []
  },
  flowRight: {
    category: "util",
    description: "Composes functions right-to-left.",
    nativeAliases: []
  },
  identity: {
    category: "util",
    description: "Returns the first argument.",
    nativeAliases: []
  },
  iteratee: {
    category: "util",
    description: "Creates a callback for iteratee shorthand.",
    nativeAliases: []
  },
  matches: {
    category: "util",
    description: "Creates a function that performs a deep partial comparison.",
    nativeAliases: []
  },
  matchesProperty: {
    category: "util",
    description: "Creates a function that compares a property value.",
    nativeAliases: []
  },
  method: {
    category: "util",
    description: "Creates a function that invokes the method at path.",
    nativeAliases: []
  },
  methodOf: {
    category: "util",
    description: "Creates a function that invokes the method at key.",
    nativeAliases: []
  },
  mixin: {
    category: "util",
    description: "Adds properties to lodash.",
    nativeAliases: []
  },
  noop: {
    category: "util",
    description: "Returns undefined.",
    nativeAliases: []
  },
  nthArg: {
    category: "util",
    description: "Creates a function that returns its nth argument.",
    nativeAliases: []
  },
  over: {
    category: "util",
    description: "Creates a function that iterates over iteratees.",
    nativeAliases: []
  },
  overEvery: {
    category: "util",
    description:
      "Creates a function that checks if all predicates return truthy.",
    nativeAliases: []
  },
  overSome: {
    category: "util",
    description:
      "Creates a function that checks if any predicate returns truthy.",
    nativeAliases: []
  },
  property: {
    category: "util",
    description: "Creates a function that returns the value at path.",
    nativeAliases: []
  },
  propertyOf: {
    category: "util",
    description: "Creates a function that returns the value at key of object.",
    nativeAliases: []
  },
  rangeRight: {
    category: "util",
    description: "Like range but descending.",
    nativeAliases: []
  },
  runInContext: {
    category: "util",
    description: "Creates a new lodash instance.",
    nativeAliases: []
  },
  stubArray: {
    category: "util",
    description: "Returns a new empty array.",
    nativeAliases: []
  },
  stubFalse: {
    category: "util",
    description: "Returns false.",
    nativeAliases: []
  },
  stubObject: {
    category: "util",
    description: "Returns a new empty object.",
    nativeAliases: []
  },
  stubString: {
    category: "util",
    description: "Returns an empty string.",
    nativeAliases: []
  },
  stubTrue: {
    category: "util",
    description: "Returns true.",
    nativeAliases: []
  },
  times: {
    category: "util",
    description: "Invokes iteratee n times.",
    nativeAliases: []
  },
  toJSON: {
    category: "util",
    description: "Returns a JSON representation of value.",
    nativeAliases: []
  },
  uniqueId: {
    category: "util",
    description: "Generates a unique ID.",
    nativeAliases: []
  },

  // Date
  now: {
    category: "date",
    description: "Returns the current timestamp.",
    nativeAliases: ["Date.now"]
  }
} as const satisfies Record<string, LodashApiEntry>;

export type LodashFunctionName = keyof typeof lodashApi;

export const isLodashFunction = (name: string): name is LodashFunctionName => {
  return Object.hasOwn(lodashApi, name);
};
