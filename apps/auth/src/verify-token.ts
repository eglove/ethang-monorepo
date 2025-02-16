import { createJsonResponse } from "@ethang/toolbelt/src/fetch/create-json-response.ts";
import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async.ts";
import { jwtVerify } from "jose";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

import { getSecretKey } from "./utils/jwt.js";

export const verifyToken = async (request: Request, environment: Env) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (isNil(token)) {
    return createJsonResponse(
      { error: "Invalid request" },
      "BAD_REQUEST",
      undefined,
      request,
    );
  }

  const jwtResult = await attemptAsync(async () => {
    return jwtVerify(token, getSecretKey(environment));
  });

  if (isError(jwtResult)) {
    return createJsonResponse(
      { error: "Unauthorized" },
      "UNAUTHORIZED",
      undefined,
      request,
    );
  }

  return createJsonResponse(jwtResult.payload, "OK", undefined, request);
};
