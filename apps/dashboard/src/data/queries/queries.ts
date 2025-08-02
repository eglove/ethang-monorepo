import filter from "lodash/filter.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil";
import isString from "lodash/isString";

const filterOutNil = (array: unknown[]) => {
  return filter(array, (value) => {
    return !isNil(value) || (isString(value) && !isEmpty(value));
  });
};

export const queryKeys = {
  allUserTodos: (userId?: string) => {
    return filterOutNil(["todos", userId]);
  },
  stats: (userId?: string) => {
    return filterOutNil(["stats", userId]);
  },
  todos: (userId?: string) => {
    return filterOutNil(["todos", userId]);
  },
};
