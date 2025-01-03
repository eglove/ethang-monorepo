import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async";
import isError from "lodash/isError";
import isNil from "lodash/isNil";
import set from "lodash/set.js";
import { z } from "zod";

import { getUser } from "./utils/get-user";
import { getHashedPassword } from "./utils/password.ts";
import { createResponse } from "./utils/util";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  username: z.string(),
});

export const signUp = async (request: Request, environment: Env) => {
  const body = await attemptAsync(async () => {
    return request.json();
  });

  if (isError(body)) {
    return createResponse({ error: "Invalid request" }, "BAD_REQUEST");
  }

  const result = signUpSchema.safeParse(body);

  if (!result.success) {
    return createResponse({ error: "Invalid arguments" }, "BAD_REQUEST");
  }

  const foundUser = await getUser(result.data.email, environment);

  if (!isNil(foundUser)) {
    return createResponse({ error: "User already exists" }, "CONFLICT");
  }

  const hashedPassword = getHashedPassword(result.data.password);
  await environment.DB.prepare("INSERT INTO Users (email, password, username) VALUES (?, ?, ?)")
    .bind(result.data.email, hashedPassword, result.data.username)
    .first();

  const user = await getUser(result.data.email, environment);

  if (isNil(user)) {
    return createResponse({ error: "Failed to create user" }, "INTERNAL_SERVER_ERROR");
  }

  set(user, ["password"], undefined);
  return createResponse(user, "CREATED");
};
