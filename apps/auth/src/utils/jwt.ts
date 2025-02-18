import type { TokenSchema } from "@ethang/schemas/auth/token.js";
import type { UserSchema } from "@ethang/schemas/auth/user.js";

import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import { jwtVerify, SignJWT } from "jose";

export const ORIGIN = "ethang.dev";

export const getSecretKey = (environment: Env) => {
  return new TextEncoder().encode(String(environment.JWT_SECRET));
};

export const createToken = async (user: UserSchema, environment: Env) => {
  return new SignJWT({
    email: user.email,
    role: user.role,
    username: user.username,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ORIGIN)
    .setAudience(ORIGIN)
    .setExpirationTime("24h")
    .sign(getSecretKey(environment));
};

export const verifyToken = async (token: string, environment: Env) => {
  return attemptAsync(async () => {
    const { payload } = await jwtVerify<TokenSchema>(
      token,
      getSecretKey(environment),
      {
        audience: ORIGIN,
        issuer: ORIGIN,
      },
    );
    return payload;
  });
};
