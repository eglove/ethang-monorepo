import { createJsonResponse } from "@ethang/toolbelt/src/fetch/create-json-response.ts";
import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

import { handleWebSocket } from "./websocket/websocket.ts";

class Store {
  public connections = new Map<string, WebSocket>([]);
}
export const store = new Store();

export default {
  async fetch(request, environment): Promise<Response> {
    const url = new globalThis.URL(request.url);
    const authorization =
      request.headers.get("Authorization") ?? url.searchParams.get("token");

    if (isNil(authorization)) {
      return createJsonResponse(
        { error: "Unauthorized" },
        "UNAUTHORIZED",
        undefined,
        request,
      );
    }

    const verifyUrl = new URL("https://auth.ethang.dev/verify");
    verifyUrl.searchParams.set("token", authorization);

    const jwtResult = await attemptAsync(async () => {
      return fetch(verifyUrl);
    });

    if (isError(jwtResult) || !jwtResult.ok) {
      return createJsonResponse(
        { error: "Unauthorized" },
        "UNAUTHORIZED",
        undefined,
        request,
      );
    }

    if ("/ws" === url.pathname) {
      return handleWebSocket(request, environment);
    }

    return createJsonResponse({ error: "Not Found" }, "NOT_FOUND", request);
  },
} satisfies ExportedHandler<Env>;
