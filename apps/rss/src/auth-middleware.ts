import type { Next } from "hono";

import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

import type { AppContext } from "./index.js";

export const authMiddleware = async (context: AppContext, next: Next) => {
  const url = new URL(context.req.url);

  if ("/" === url.pathname || "/openapi.json" === url.pathname) {
    return next();
  }

  const authorization =
    context.req.header("Authorization") ?? url.searchParams.get("token");

  if (isNil(authorization)) {
    return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
  }

  const verifyUrl = new URL("https://auth.ethang.dev/verify");
  verifyUrl.searchParams.set("token", authorization);

  const jwtResult = await attemptAsync(async () => {
    return fetch(verifyUrl);
  });

  if (isError(jwtResult) || !jwtResult.ok) {
    return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
  }

  return next();
};
