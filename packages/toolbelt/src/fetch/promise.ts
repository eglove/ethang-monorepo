import isNil from "lodash/isNil.js";
import keys from "lodash/keys.js";
import values from "lodash/values.js";

const categorizeResults = <K extends PropertyKey, T,>(
  promiseKeys: readonly K[],
  results: PromiseSettledResult<Awaited<T>>[],
) => {
  let settledPromises = {} as Record<K, Awaited<T> | Error>;

  for (const [index, key] of promiseKeys.entries()) {
    const result = results[index];

    if (isNil(result)) {
      break;
    }

    if ("fulfilled" === result.status) {
      settledPromises = {
        ...settledPromises,
        [key]: result.value,
      };
    }

    if ("rejected" === result.status) {
      settledPromises[key] = result.reason as Error;
    }
  }

  return settledPromises;
};

export const promiseAllSettled = async <
  K extends PropertyKey,
  T extends Record<K, Promise<unknown>>,
>(
  promises: T,
) => {
  const promiseKeys = keys(promises) as K[];
  const promiseValues = values(promises);
  const results = await Promise.allSettled(promiseValues);

  return categorizeResults(promiseKeys,
    results) as {
    [P in keyof T]: Awaited<T[P]> | Error;
  };
};
