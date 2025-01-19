import {
  createJsonResponse,
} from "@ethang/toolbelt/src/fetch/create-json-response.ts";
import isNil from "lodash/isNil.js";

import { getUser } from "./utils/get-user.ts";
import { getIsAdmin } from "./utils/is-user.ts";

export const deleteUser = async (
  request: Request, environment: Env,
) => {
  const isAdmin = await getIsAdmin(request, environment);

  if (!isAdmin) {
    return createJsonResponse(
      { error: "Unauthorized" },
      "UNAUTHORIZED",
      undefined,
      request,
    );
  }

  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  if (isNil(email)) {
    return createJsonResponse(
      { error: "Invalid request" },
      "BAD_REQUEST",
      undefined,
      request,
    );
  }

  await environment.DB.prepare("DELETE FROM Users WHERE email = ?").bind(email)
    .first();

  const oldUser = await getUser(email, environment);

  if (!isNil(oldUser)) {
    return createJsonResponse(
      { error: "Failed to delete user" },
      "INTERNAL_SERVER_ERROR",
      undefined,
      request,
    );
  }

  return createJsonResponse(
    { data: "User deleted" },
    "OK",
    undefined,
    request,
  );
};
