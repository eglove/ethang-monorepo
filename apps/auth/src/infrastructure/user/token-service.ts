import { Effect } from "effect";
import { jwtVerify, SignJWT } from "jose";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";

import { TokenSignError } from "../../errors/token-sign-error.ts";
import { TokenVerifyError } from "../../errors/token-verify-error.ts";

export const createTokenService = (secret: string) => {
  const textEncoder = new TextEncoder();
  const secretKey = textEncoder.encode(secret);

  return {
    sign: (payload: Record<string, string>) => {
      return Effect.tryPromise({
        catch: (cause) => {
          return new TokenSignError(String(cause));
        },
        try: async () => {
          const jwt = new SignJWT(payload);
          return jwt
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("1yr")
            .sign(secretKey);
        }
      });
    },
    verify: (token: string) => {
      return Effect.tryPromise({
        catch: (cause) => {
          return new TokenVerifyError(String(cause));
        },
        try: async () => {
          const result = await jwtVerify(token, secretKey);
          const payload: Record<string, string> = {};
          for (const [key, value] of Object.entries(result.payload)) {
            if (isNil(value)) {
              payload[key] = "";
            } else if (isString(value)) {
              payload[key] = value;
            } else {
              payload[key] = JSON.stringify(value);
            }
          }
          return { payload };
        }
      });
    }
  };
};
