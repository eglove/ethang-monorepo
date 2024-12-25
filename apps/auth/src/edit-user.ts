import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async";
import isError from "lodash/isError";
import isNil from "lodash/isNil";
import set from "lodash/set.js";
import { z } from "zod";

import { getUser } from "./utils/get-user";
import { getIsUser } from "./utils/is-user.ts";
import { getHashedPassword } from "./utils/password.ts";
import { createResponse } from "./utils/util";

const editUserSchema = z.object({
  email: z.string().email(),
  password: z.string().optional()
    .nullable()
    .default(null),
  role: z.string().optional()
    .nullable()
    .default(null),
  username: z.string().optional()
    .nullable()
    .default(null),
});

export const editUser = async (request: Request, environment: Env) => {
  const body = await attemptAsync(async () => {
    return request.json();
  });

  if (isError(body)) {
    return createResponse({ error: "Invalid request" }, "BAD_REQUEST");
  }

  const result = editUserSchema.safeParse(body);

  if (!result.success) {
    return createResponse({ error: "Invalid arguments" }, "BAD_REQUEST");
  }

  const isUser = await getIsUser(request, environment, result.data.email);

  if (!isUser) {
    return createResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
  }

  const previousUser = await getUser(result.data.email, environment);

  if (isNil(previousUser)) {
    return createResponse({ error: "User not found" }, "NOT_FOUND");
  }

  await environment.DB.prepare("UPDATE Users SET email = ?, password = ?, username = ?, role = ? WHERE email = ?")
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
  return createResponse(user, "OK");
};
