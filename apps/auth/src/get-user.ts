import isNil from "lodash/isNil";

import { getUser as getUserUtil } from "./utils/get-user";
import { createResponse } from "./utils/util";

export const getUser = async (request: Request, environment: Env) => {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  if (isNil(email)) {
    return createResponse({ error: "Invalid request" }, "BAD_REQUEST");
  }

  const foundUser = await getUserUtil(email, environment);

  if (isNil(foundUser)) {
    return createResponse({ error: "User not found" }, "NOT_FOUND");
  }

  return createResponse(foundUser, "OK");
};
