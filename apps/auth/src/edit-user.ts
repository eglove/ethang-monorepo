import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async";
import isError from "lodash/isError";
import isNil from "lodash/isNil";
import { z } from "zod";

import { getUser } from "./utils/get-user";
import { createResponse } from "./utils/util";

const editUserSchema = z.object({
  email: z.string().email(),
  password: z.string().optional()
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

  const previousUser = await getUser(result.data.email, environment);

  if (isNil(previousUser)) {
    return createResponse({ error: "User not found" }, "NOT_FOUND");
  }

  await environment.DB.prepare("UPDATE Users SET email = ?, password = ?, username = ? WHERE email = ?")
    .bind(
      result.data.email,
      result.data.password ?? previousUser.password,
      result.data.username ?? previousUser.username,
      result.data.email,
    )
    .raw();

  const user = await getUser(result.data.email, environment);

  return createResponse(user, "OK");
};
