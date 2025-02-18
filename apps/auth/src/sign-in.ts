import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import set from "lodash/set.js";
import { z } from "zod";

import { getUser } from "./utils/get-user.ts";
import { createToken } from "./utils/jwt.ts";
import { validatePassword } from "./utils/password.ts";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const signIn = async (request: Request, environment: Env) => {
  const body = await attemptAsync(async () => {
    return request.json();
  });

  if (isError(body)) {
    return createJsonResponse({ error: "Invalid request" }, "BAD_REQUEST");
  }

  const result = signInSchema.safeParse(body);

  if (!result.success) {
    return createJsonResponse({ error: "Invalid arguments" }, "BAD_REQUEST");
  }

  const foundUser = await getUser(result.data.email, environment);

  if (isNil(foundUser)) {
    return createJsonResponse({ error: "User not found" }, "NOT_FOUND");
  }

  const isPasswordValid = await validatePassword(
    result.data.password,
    foundUser.password,
  );

  if (!isPasswordValid) {
    return createJsonResponse({ error: "Invalid password" }, "UNAUTHORIZED");
  }

  await environment.DB.prepare(
    "UPDATE Users SET lastLoggedIn = ? WHERE email = ?",
  )
    .bind(new Date().toISOString(), result.data.email)
    .raw();

  // Create JWT token
  set(foundUser, ["password"], undefined);
  const token = await createToken(foundUser, environment);

  return createJsonResponse({ token }, "OK");
};
