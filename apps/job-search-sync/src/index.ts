import { createJsonResponse } from "@ethang/toolbelt/src/fetch/create-json-response.ts";
import isNil from "lodash/isNil.js";

export default {
  async fetch(request, environment, context) {
    if ("OPTIONS" === request.method) {
      return createJsonResponse(null, "OK", undefined, request);
    }

    const authorization = request.headers.get("Authorization");

    if (isNil(authorization)) {
      return createJsonResponse(
        { error: "Unauthorized" },
        "UNAUTHORIZED",
        undefined,
        request,
      );
    }

    return createJsonResponse(
      { error: "Not Found" },
      "NOT_FOUND",
      undefined,
      request,
    );
  },
} satisfies ExportedHandler<Env>;
