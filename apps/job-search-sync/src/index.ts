import { createJsonResponse } from "@ethang/toolbelt/src/fetch/create-json-response.ts";
import isNil from "lodash/isNil.js";

import { syncData } from "./sync-data.js";

const unauthorizedResponse = (request: Request) =>
  createJsonResponse(
    { error: "Unauthorized" },
    "UNAUTHORIZED",
    undefined,
    request,
  );

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if ("OPTIONS" === request.method) {
      return createJsonResponse(null, "OK", undefined, request);
    }

    const authorization = request.headers.get("Authorization");

    if (isNil(authorization)) {
      return unauthorizedResponse(request);
    }

    const verifyUrl = new URL("https://auth.ethang.dev/verify");
    verifyUrl.searchParams.set("token", authorization);
    const verifyResponse = await globalThis.fetch(verifyUrl, {
      method: "POST",
    });

    // TODO readd on reploy
    // if (!verifyResponse.ok) {
    //   return unauthorizedResponse(request);
    // }

    if ("/data-sync" === url.pathname && "POST" === request.method) {
      return syncData(request);
    }

    return createJsonResponse(
      { error: "Not Found" },
      "NOT_FOUND",
      undefined,
      request,
    );
  },
} satisfies ExportedHandler<Env>;
