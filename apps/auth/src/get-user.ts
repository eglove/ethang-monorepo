import isNil from "lodash/isNil";
import set from "lodash/set";

import { getUser as getUserUtil } from "./utils/get-user";
import { getIsUser } from "./utils/is-user.ts";
import { createResponse } from "./utils/util";

export const getUser = async (request: Request, environment: Env) => {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  if (isNil(email)) {
    return createResponse({ error: "Invalid request" }, "BAD_REQUEST");
  }

  const isUser = await getIsUser(request, environment, email);

  if (!isUser) {
    return createResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
  }

  const foundUser = await getUserUtil(email, environment);

  if (isNil(foundUser)) {
    return createResponse({ error: "User not found" }, "NOT_FOUND");
  }

  set(foundUser, ["password"], undefined);
  return createResponse(foundUser, "OK");
};
