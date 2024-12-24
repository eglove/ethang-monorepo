import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async.ts";
import bcrypt from "bcryptjs";
import isError from "lodash/isError";
import isNil from "lodash/isNil";
import { z } from "zod";

import { getUser } from "./utils/get-user.ts";
import { createToken } from "./utils/jwt.ts";
import { createResponse } from "./utils/util.ts";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const signIn = async (request: Request, environment: Env) => {
  const body = await attemptAsync(async () => {
    return request.json();
  });

  if (isError(body)) {
    return createResponse({ error: "Invalid request" }, "BAD_REQUEST");
  }

  const result = signInSchema.safeParse(body);

  if (!result.success) {
    return createResponse({ error: "Invalid arguments" }, "BAD_REQUEST");
  }

  const foundUser = await getUser(result.data.email, environment);

  if (isNil(foundUser)) {
    return createResponse({ error: "User not found" }, "NOT_FOUND");
  }

  const isPasswordValid = await bcrypt.compare(
    result.data.password, foundUser.password,
  );

  if (!isPasswordValid) {
    return createResponse({ error: "Invalid password" }, "UNAUTHORIZED");
  }

  // Create JWT token
  const token = await createToken(foundUser, environment);

  return createResponse({ token }, "OK");
};
