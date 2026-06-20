import { auth } from "@ethang/intl/en/auth.ts";
import isNil from "lodash/isNil.js";

export type User = {
  email: string;
  exp: number;
  iat: number;
  role?: string;
  sub: string;
  username: string;
};

export const authenticate = async (request: Request) => {
  const token = request.headers.get("X-Token");

  if (isNil(token)) {
    throw new Error(auth.UNAUTHORIZED);
  }

  const response = await fetch("https://auth.ethang.dev/verify", {
    headers: {
      "X-Token": token
    }
  });

  if (!response.ok) {
    throw new Error(auth.UNAUTHORIZED);
  }

  const user: User = await response.json();
  const currentTime = Math.floor(Date.now() / 1000);

  if (currentTime > user.exp) {
    throw new Error(auth.UNAUTHORIZED);
  }

  return user;
};
