import { Effect, Layer } from "effect";
import { jwtVerify } from "jose";
import isString from "lodash/isString.js";

import { TokenVerifier } from "../../application/ports/token-verifier.ts";
import { TokenError } from "../../errors/token-error.ts";

export const createTokenVerifierLayer = (secret: string) => {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);
  return Layer.succeed(TokenVerifier, {
    verify: (token) => {
      return Effect.gen(function* () {
        const email = yield* Effect.tryPromise({
          catch: (cause) => {
            return new TokenError(String(cause));
          },
          try: async () => {
            const { payload } = await jwtVerify(token, secretKey);
            return payload["email"];
          }
        });
        if (!isString(email)) {
          return yield* Effect.fail(
            new TokenError("token is missing email claim")
          );
        }
        return email;
      });
    }
  });
};
