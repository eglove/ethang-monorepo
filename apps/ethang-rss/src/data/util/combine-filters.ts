import { and, type SQL } from "drizzle-orm";
import isNil from "lodash/isNil.js";

export const combineFilters = (
  first: null | SQL | undefined,
  second: null | SQL | undefined
) => {
  if (isNil(first)) {
    return second;
  }

  return isNil(second) ? first : and(first, second);
};
