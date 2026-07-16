import { Effect, Schema } from "effect";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";

import { UnauthorizedError } from "./errors/unauthorized-error.ts";

const StoredSessionSchema = Schema.Struct({
  sessionToken: Schema.optional(Schema.String)
});

const getSessionToken = (request: Request, environment: Env) => {
  return Effect.gen(function* () {
    const clientToken = request.headers.get("X-Token");

    if (!isNil(clientToken) && "" !== clientToken) {
      return clientToken;
    }

    const signInOptions = {
      body: JSON.stringify({
        email: environment.ADMIN_USER,
        password: environment.ADMIN_PASS
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    };

    const initialResponse = yield* Effect.tryPromise({
      catch: () => {
        return new UnauthorizedError({ message: "Unauthorized" });
      },
      try: async () => {
        return fetch("https://auth.ethang.dev/verify", signInOptions);
      }
    });

    const response = initialResponse.ok
      ? initialResponse
      : yield* Effect.tryPromise({
          catch: () => {
            return new UnauthorizedError({ message: "Unauthorized" });
          },
          try: async () => {
            return fetch("https://auth.ethang.dev/sign-in", signInOptions);
          }
        });

    if (!response.ok) {
      return yield* Effect.fail(
        new UnauthorizedError({ message: "Unauthorized" })
      );
    }

    const verifiedData = yield* Effect.tryPromise({
      catch: () => {
        return new UnauthorizedError({ message: "Unauthorized" });
      },
      try: async () => {
        return Schema.decodeUnknownPromise(StoredSessionSchema)(
          await response.json()
        );
      }
    });

    if (!isString(verifiedData.sessionToken)) {
      return yield* Effect.fail(
        new UnauthorizedError({ message: "Unauthorized" })
      );
    }

    return verifiedData.sessionToken;
  });
};

export { getSessionToken };
export { UnauthorizedError } from "./errors/unauthorized-error.ts";
