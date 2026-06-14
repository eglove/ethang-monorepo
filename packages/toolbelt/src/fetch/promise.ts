import isBoolean from "lodash/isBoolean.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import isNumber from "lodash/isNumber.js";
import isString from "lodash/isString.js";
import keys from "lodash/keys.js";
import values from "lodash/values.js";

const getErrorMessage = (reason: unknown) => {
  if (undefined === reason) {
    return "Rejected without reason";
  }

  if (
    isString(reason) ||
    isNumber(reason) ||
    isBoolean(reason) ||
    null === reason
  ) {
    return String(reason);
  }

  return "An error occurred";
};

const processResult = <T>(result: PromiseSettledResult<Awaited<T>>) => {
  if ("fulfilled" === result.status) {
    return result.value;
  }

  const reason: unknown = result.reason;
  return isError(reason) ? reason : new Error(getErrorMessage(reason));
};

const categorizeResults = <K extends PropertyKey, T>(
  promiseKeys: readonly K[],
  results: PromiseSettledResult<Awaited<T>>[]
) => {
  // @ts-expect-error init to {}
  let settledPromises: Record<K, Awaited<T> | Error> = {};

  for (const [index, key] of promiseKeys.entries()) {
    const result = results[index];

    if (isNil(result)) {
      break;
    }

    settledPromises = {
      ...settledPromises,
      [key]: processResult(result)
    };
  }

  return settledPromises;
};

export const promiseAllSettled = async <
  K extends PropertyKey,
  T extends Record<K, Promise<unknown>>
>(
  promises: T
) => {
  const promiseKeys = keys(promises);
  const promiseValues = values(promises);
  const results = await Promise.allSettled(promiseValues);

  return categorizeResults(promiseKeys, results);
};
