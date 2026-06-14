import type { ZodObject } from "zod";

import get from "lodash/get.js";
import isArray from "lodash/isArray.js";
import isFunction from "lodash/isFunction.js";
import isNil from "lodash/isNil.js";
import keys from "lodash/keys.js";

type SearchParametersRecord = Record<
  string,
  number | number[] | string | string[] | undefined
>;

export const createSearchParameters = <Z extends ZodObject>(
  searchParameters: SearchParametersRecord,
  searchParametersSchema: ZodObject
): Error | ReturnType<Z["safeParse"]>["error"] | URLSearchParams => {
  if (isNil(searchParametersSchema)) {
    return new Error("must provide a valid zod schema");
  }

  const safeParse = get(searchParametersSchema, "safeParse");
  if (!isFunction(safeParse)) {
    return new Error("must provide a valid zod schema");
  }

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
    const values = searchParameters[key];

    if (isArray(values)) {
      appendSearchParameters(key, values);
    } else if (isNil(values)) {
      // do nothing
    } else {
      search.append(key, String(searchParameters[key]));
    }
  }

  return search;
};
