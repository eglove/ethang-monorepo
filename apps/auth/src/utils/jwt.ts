import type { TokenSchema } from "@ethang/schemas/src/auth/token.ts";
import type { UserSchema } from "@ethang/schemas/src/auth/user.ts";

import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import { jwtVerify, SignJWT } from "jose";

export const ORIGIN = "ethang.dev";

export const getSecretKey = async (environment: Env) => {
  const key = await environment["auth-token"].get();
  return new TextEncoder().encode(key);
};

export const createToken = async (user: UserSchema, environment: Env) => {
  const key = await getSecretKey(environment);

  return new SignJWT({
    email: user.email,
    role: user.role,
    username: user.username,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ORIGIN)
    .setAudience(ORIGIN)
    .setExpirationTime("365d")
    .sign(key);
};

export const verifyToken = async (token: string, environment: Env) => {
  const key = await getSecretKey(environment);

  return attemptAsync(async () => {
    const { payload } = await jwtVerify<TokenSchema>(token, key, {
      audience: ORIGIN,
      issuer: ORIGIN,
    });
    return payload;
  });
};
