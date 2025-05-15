import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import { jwtVerify } from "jose";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

import { getSecretKey } from "./utils/jwt.js";

export const verifyToken = async (request: Request, environment: Env) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (isNil(token)) {
    return createJsonResponse({ error: "Invalid request" }, "BAD_REQUEST");
  }

  const jwtResult = await attemptAsync(async () => {
    const key = await getSecretKey(environment);
    return jwtVerify(token, key);
  });

  if (isError(jwtResult)) {
    return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
  }

  return createJsonResponse(jwtResult.payload, "OK");
};
