import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async.ts";
import { jwtVerify, SignJWT } from "jose";

import type { User } from "../types/database-types.ts";

const ETHANG = "ethang.dev";

export type Token = {
  email: string;
  role: string;
  username: string;
};

export const getSecretKey = (environment: Env) => {
  return new TextEncoder().encode(String(environment.JWT_SECRET));
};

export const createToken = async (user: User, environment: Env) => {
  return new SignJWT({
    email: user.email,
    role: user.role,
    username: user.username,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ETHANG)
    .setAudience(ETHANG)
    .setExpirationTime("24h")
    .sign(getSecretKey(environment));
};

export const verifyToken = async (token: string, environment: Env) => {
  return attemptAsync(async () => {
    const { payload } = await jwtVerify<Token>(
      token,
      getSecretKey(environment),
      {
        audience: ETHANG,
        issuer: ETHANG,
      },
    );
    return payload;
  });
};
