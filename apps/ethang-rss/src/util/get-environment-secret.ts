import { Effect } from "effect";
import constant from "lodash/constant.js";
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

export const getSecretValue = (
  secret: SecretsStoreSecret
): Effect.Effect<string | undefined> => {
  return Effect.gen(function* () {
    return yield* Effect.tryPromise({
      catch: constant(undefined),
      try: async () => {
        return secret.get();
      }
    }).pipe(
      Effect.catchAll(() => {
        return Effect.succeed(undefined);
      })
    );
  });
};
