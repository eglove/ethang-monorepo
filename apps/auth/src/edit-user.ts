import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import set from "lodash/set.js";
import { z } from "zod";

import { getUser } from "./utils/get-user.ts";
import { getIsUser } from "./utils/is-user.ts";
import { getHashedPassword } from "./utils/password.ts";

const editUserSchema = z.object({
  email: z.string().email(),
  password: z.string().optional().nullable().default(null),
  role: z.string().optional().nullable().default(null),
  username: z.string().optional().nullable().default(null),
});

export const editUser = async (request: Request, environment: Env) => {
  const body = await attemptAsync(async () => {
    return request.json();
  });

  if (isError(body)) {
    return createJsonResponse({ error: "Invalid request" }, "BAD_REQUEST");
  }

  const result = editUserSchema.safeParse(body);

  if (!result.success) {
    return createJsonResponse({ error: "Invalid arguments" }, "BAD_REQUEST");
  }

  const isUser = await getIsUser(request, environment, result.data.email);

  if (!isUser) {
    return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
  }

  const previousUser = await getUser(result.data.email, environment);

  if (isNil(previousUser)) {
    return createJsonResponse({ error: "User not found" }, "NOT_FOUND");
  }

  await environment.DB.prepare(
    "UPDATE Users SET email = ?, password = ?, username = ?, role = ? WHERE email = ?",
  )
    .bind(
      result.data.email,
      getHashedPassword(result.data.password ?? previousUser.password),
      result.data.username ?? previousUser.username,
      result.data.role ?? previousUser.role,
      result.data.email,
    )
    .raw();

  const user = await getUser(result.data.email, environment);

  set(user, ["password"], undefined);
  return createJsonResponse(user, "OK");
};
