import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";

export const getEnvironmentString = (
  object: unknown,
  key: string
): string | undefined => {
  if (isObject(object) && !isNil(object) && Object.hasOwn(object, key)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const value = (object as Record<string, unknown>)[key];
    // eslint-disable-next-line lodash/prefer-lodash-typecheck
    return "string" === typeof value ? value : undefined;
  }
  return undefined;
};
