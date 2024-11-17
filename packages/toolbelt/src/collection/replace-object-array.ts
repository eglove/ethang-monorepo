import assign from "lodash/assign.js";
import isFunction from "lodash/isFunction.js";
import map from "lodash/map.js";

type KeyValuePredicate<T,> = { [K in keyof T]: [K, T[K]] }[keyof T];

export const replaceObjectArray = <T,>(
  collection: T[],
  predicate: ((item: T) => boolean) | KeyValuePredicate<T>,
  newProperties: Partial<T>,
) => {
  return map(collection, (item) => {
    const isMatch = isFunction(predicate)
      ? predicate(item)
      : item[predicate[0]] === predicate[1];

    return isMatch
      ? assign({}, item, newProperties)
      : item;
  });
};
