import { createJsonResponse } from "@ethang/toolbelt/src/fetch/create-json-response.ts";
import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async.ts";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import set from "lodash/set.js";
import { z } from "zod";

import { getUser } from "./utils/get-user.ts";
import { createToken } from "./utils/jwt.ts";
import { getHashedPassword } from "./utils/password.ts";

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
    return createJsonResponse(
      { error: "Invalid request" },
      "BAD_REQUEST",
      undefined,
      request,
    );
  }

  const result = signUpSchema.safeParse(body);

  if (!result.success) {
    return createJsonResponse(
      { error: "Invalid arguments" },
      "BAD_REQUEST",
      undefined,
      request,
    );
  }

  const foundUser = await getUser(result.data.email, environment);

  if (!isNil(foundUser)) {
    return createJsonResponse(
      { error: "User already exists" },
      "CONFLICT",
      undefined,
      request,
    );
  }

  const hashedPassword = getHashedPassword(result.data.password);
  await environment.DB.prepare(
    "INSERT INTO Users (email, password, username) VALUES (?, ?, ?)",
  )
    .bind(result.data.email, hashedPassword, result.data.username)
    .first();

  const user = await getUser(result.data.email, environment);

  if (isNil(user)) {
    return createJsonResponse(
      { error: "Failed to create user" },
      "INTERNAL_SERVER_ERROR",
      undefined,
      request,
    );
  }

  set(user, ["password"], undefined);
  const token = await createToken(user, environment);

  return createJsonResponse({ token }, "CREATED", undefined, request);
};
