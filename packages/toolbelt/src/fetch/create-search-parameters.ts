import { Schema } from "effect";
import isArray from "lodash/isArray.js";
import isNil from "lodash/isNil.js";
import keys from "lodash/keys.js";

type SearchParametersRecord = Record<
  string,
  number | number[] | string | string[] | undefined
>;

export const createSearchParameters = <Z extends Schema.Schema.AnyNoContext>(
  searchParameters: SearchParametersRecord,
  searchParametersSchema: Z
): Error | URLSearchParams => {
  if (isNil(searchParametersSchema)) {
    return new Error("must provide a valid schema");
  }

  try {
    Schema.decodeUnknownSync(searchParametersSchema)(searchParameters);
  } catch {
    return new Error("Validation failed");
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
