import type { ZodObject } from "zod";

import isArray from "lodash/isArray.js";
import isNil from "lodash/isNil.js";
import keys from "lodash/keys.js";

type SearchParametersRecord = Record<
  string,
  number | number[] | string | string[] | undefined
>;

export const createSearchParameters = <Z extends ZodObject>(
  searchParameters: SearchParametersRecord,
  searchParametersSchema: ZodObject,
): ReturnType<Z["safeParse"]>["error"] | URLSearchParams => {
  const result = searchParametersSchema.safeParse(searchParameters);

  if (!result.success) {
    return result.error;
  }

  const search = new URLSearchParams();

  const appendSearchParameters = (key: string, values: number[] | string[]) => {
    for (const value of values) {
      if (!isNil(value)) {
        search.append(key, String(value));
      }
    }
  };

  for (const key of keys(searchParameters)) {
    if (Object.hasOwn(searchParameters, key)) {
      const values = searchParameters[key];

      if (isArray(values)) {
        appendSearchParameters(key, values);
      } else if (isNil(values)) {
        // do nothing
      } else {
        search.append(key, String(searchParameters[key]));
      }
    }
  }

  return search;
};
