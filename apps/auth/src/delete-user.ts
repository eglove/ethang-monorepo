import isNil from "lodash/isNil.js";

import { getUser } from "./utils/get-user.ts";
import { getIsAdmin } from "./utils/is-user.ts";
import { createResponse } from "./utils/util.ts";

export const deleteUser = async (
  request: Request, environment: Env,
) => {
  const isAdmin = await getIsAdmin(request, environment);

  if (!isAdmin) {
    return createResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
  }

  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  if (isNil(email)) {
    return createResponse({ error: "Invalid request" }, "BAD_REQUEST");
  }

  await environment.DB.prepare("DELETE FROM Users WHERE email = ?").bind(email)
    .first();

  const oldUser = await getUser(email, environment);

  if (!isNil(oldUser)) {
    return createResponse({ error: "Failed to delete user" }, "INTERNAL_SERVER_ERROR");
  }

  return createResponse({ data: "User deleted" }, "OK");
};
