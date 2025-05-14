export const LARGE_ARRAY_SIZE = 200;

export const _arguments = toArguments([1, 2, 3]);
// eslint-disable-next-line no-sparse-arrays
export const falsy = [, null, undefined, false, 0, Number.NaN, ""];
export const empties = [[], {}, ...falsy.slice(1)];

// eslint-disable-next-line func-style
export const stubArray = function () {
  return [];
};

// eslint-disable-next-line func-style,lodash/prefer-constant
export const stubOne = function () {
  return 1;
};

// eslint-disable-next-line func-style
export const stubNaN = function () {
  return Number.NaN;
};

// eslint-disable-next-line sonar/declarations-in-global-scope
function toArguments(array: unknown[]) {
  // eslint-disable-next-line prefer-spread
  return function () {
    // eslint-disable-next-line prefer-rest-params,sonar/arguments-usage
    return arguments;
    // @ts-expect-error allow for test
  }.apply(undefined, array);
}
