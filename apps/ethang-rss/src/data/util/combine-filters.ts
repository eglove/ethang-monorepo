import { and, type SQL } from "drizzle-orm";
import isNil from "lodash/isNil.js";

export const combineFilters = (first: null | SQL, second: null | SQL) => {
  if (isNil(first)) {
    return second;
  }

  if (isNil(second)) {
    return first;
  }

  return and(first, second);
};
