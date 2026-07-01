import { DateTime } from "effect";
import isNil from "lodash/isNil.js";

export type User = {
  email: string;
  exp: number;
  iat: number;
  role?: string;
  sub: string;
  username: string;
};

export const authenticate = async (request: Request): Promise<User> => {
  const token = request.headers.get("X-Token");

  if (isNil(token)) {
    throw new Error("Unauthorized");
  }

  const response = await fetch("https://auth.ethang.dev/verify", {
    headers: {
      "X-Token": token
    }
  });

  if (!response.ok) {
    throw new Error("Unauthorized");
  }

  const user: User = await response.json();
  const currentTime = Math.floor(
    DateTime.toEpochMillis(DateTime.unsafeNow()) / 1000
  );

  if (currentTime > user.exp) {
    throw new Error("Unauthorized");
  }

  return user;
};
