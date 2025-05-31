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
  allContacts: (userId?: string) => {
    return filterOutNil(["contacts", userId]);
  },
  allUserApplications: (userId?: string) => {
    return filterOutNil(["applications", userId]);
  },
  allUserQuestionAnswers: (userId?: string) => {
    return filterOutNil(["questionAnswers", userId]);
  },
  allUserTodos: (userId?: string) => {
    return filterOutNil(["todos", userId]);
  },
  applications: (userId?: string, page?: number, search?: string) => {
    return filterOutNil(["applications", userId, page, search]);
  },
  bookmarks: (userId?: string) => {
    return filterOutNil(["bookmarks", userId]);
  },
  contacts: (userId?: string) => {
    return filterOutNil(["contacts", userId]);
  },
  questionAnswers: (userId?: string) => {
    return filterOutNil(["questionAnswers", userId]);
  },
  stats: (userId?: string) => {
    return filterOutNil(["stats", userId]);
  },
  todos: (userId?: string) => {
    return filterOutNil(["todos", userId]);
  },
};
