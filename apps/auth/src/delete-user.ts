import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import isNil from "lodash/isNil.js";

import { getUser } from "./utils/get-user.ts";
import { getIsAdmin } from "./utils/is-user.ts";

export const deleteUser = async (request: Request, environment: Env) => {
  const isAdmin = await getIsAdmin(request, environment);

  if (!isAdmin) {
    return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
  }

  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  if (isNil(email)) {
    return createJsonResponse({ error: "Invalid request" }, "BAD_REQUEST");
  }

  await environment.DB.prepare("DELETE FROM Users WHERE email = ?")
    .bind(email)
    .first();

  const oldUser = await getUser(email, environment);

  if (!isNil(oldUser)) {
    return createJsonResponse(
      { error: "Failed to delete user" },
      "INTERNAL_SERVER_ERROR",
    );
  }

  return createJsonResponse({ data: "User deleted" }, "OK");
};
