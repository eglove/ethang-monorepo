import filter from "lodash/filter.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil";

export type Filters = {
  filterBy?: string;
  filterValue?: string;
  limit?: number;
  page?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

const filterOutNil = (array: unknown[]) => {
  return filter(array, (value) => {
    return !isNil(value) && !isEmpty(value);
  });
};

export const queryKeys = {
  allUserApplications: (userId?: string) => {
    return filterOutNil(["applications", userId]);
  },
  allUserQuestionAnswers: (userId?: string) => {
    return filterOutNil(["questionAnswers", userId]);
  },
  allUserTodos: (userId?: string) => {
    return filterOutNil(["todos", userId]);
  },
  applications: (userId?: string, filters?: Filters) => {
    return filterOutNil(["applications", userId, filters]);
  },
  bookmarks: (userId?: string) => {
    return filterOutNil(["bookmarks", userId]);
  },
  questionAnswers: (userId?: string, filters?: Filters) => {
    return filterOutNil(["questionAnswers", userId, filters]);
  },
  todos: (userId?: string, filters?: Filters) => {
    return filterOutNil(["todos", userId, filters]);
  },
};
