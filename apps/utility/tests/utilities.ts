export const LARGE_ARRAY_SIZE = 200;

export const _arguments = toArguments([1, 2, 3]);
export const falsy = [, null, undefined, false, 0, Number.NaN, ""];
export const empties = [[], {}, ...falsy.slice(1)];
export const arrayPrototype = Array.prototype;
export const slice = arrayPrototype.slice;

export const stubArray = function () {
  return [];
};

export const stubOne = function () {
  return 1;
};

export const stubNaN = function () {
  return Number.NaN;
};

function toArguments(array: unknown[]) {
  return function () {
    return arguments;
  }.apply(undefined, array);
}
