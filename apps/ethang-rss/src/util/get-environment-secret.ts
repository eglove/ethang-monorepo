import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";
import isString from "lodash/isString.js";

export const getEnvironmentString = (
  object: unknown,
  key: string
): null | string => {
  if (isObject(object) && !isNil(object) && Object.hasOwn(object, key)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const value = (object as Record<string, unknown>)[key];

    return isString(value) ? value : null;
  }
  return null;
};
