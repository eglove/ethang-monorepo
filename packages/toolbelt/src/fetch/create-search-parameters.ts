import { Effect, Schema } from "effect";
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
): Effect.Effect<URLSearchParams, Error> => {
  return Effect.gen(function* () {
    if (isNil(searchParametersSchema)) {
      return yield* Effect.fail(new Error("must provide a valid schema"));
    }

    yield* Effect.try({
      catch: () => {
        return new Error("Validation failed");
      },
      try: () => {
        Schema.decodeUnknownSync(searchParametersSchema)(searchParameters);
      }
    });

    const search = new URLSearchParams();

    const appendSearchParameters = (
      key: string,
      values: number[] | string[]
    ) => {
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
  });
};
