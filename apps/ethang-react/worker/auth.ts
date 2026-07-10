import { Effect } from "effect";
import isString from "lodash/isString.js";

import { UnauthorizedError } from "./errors/unauthorized-error.ts";

const getSessionToken = (request: Request, environment: Env) => {
  return Effect.gen(function* () {
    const clientToken = request.headers.get("X-Token");

    if (null !== clientToken && "" !== clientToken) {
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
      try: async (): Promise<{ sessionToken: string }> => {
        return response.json();
      }
    });

    const { sessionToken } = verifiedData;

    if (!isString(sessionToken)) {
      return yield* Effect.fail(
        new UnauthorizedError({ message: "Unauthorized" })
      );
    }

    return sessionToken;
  });
};

export { getSessionToken };
export { UnauthorizedError } from "./errors/unauthorized-error.ts";
