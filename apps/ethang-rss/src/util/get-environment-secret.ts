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

export const getSecretValue = async (
  secret: unknown
): Promise<string | undefined> => {
  if (
    // eslint-disable-next-line lodash/prefer-lodash-typecheck
    "object" === typeof secret &&
    null !== secret &&
    "get" in secret &&
    // eslint-disable-next-line lodash/prefer-lodash-typecheck
    "function" === typeof secret.get
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      return await (secret as { get: () => Promise<string> }).get();
    } catch {
      return undefined;
    }
  }
  // eslint-disable-next-line lodash/prefer-lodash-typecheck
  return "string" === typeof secret ? secret : undefined;
};
