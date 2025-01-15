import {
  createJsonResponse,
} from "@ethang/toolbelt/src/fetch/create-json-response.ts";
import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async.js";
import { jwtVerify } from "jose";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

import { handleWebSocket } from "./websocket/websocket.ts";

export const getSecretKey = (environment: Env) => {
  return new TextEncoder().encode(String(environment.JWT_SECRET));
};

class Store {
  public connections = new Map<string, WebSocket>([]);
}
export const store = new Store();

// eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImhlbGxvQGV0aGFuZy5lbWFpbCIsInJvbGUiOiJhZG1pbiIsInVzZXJuYW1lIjoiZXRoYW5nIiwiaXNzIjoiZXRoYW5nLmRldiIsImF1ZCI6ImV0aGFuZy5kZXYiLCJleHAiOjE3MzY5OTA2MDN9.4vMN47Rkah2rDXScqxHHBG6WeOEVorVxTZNe28nIRQE

export default {
  async fetch(
    request,
    environment,
  ): Promise<Response> {
    const url = new globalThis.URL(request.url);
    const authorization = request.headers.get("Authorization");

    if (isNil(authorization)) {
      return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
    }

    const jwtResult = await attemptAsync(async () => {
      return jwtVerify(authorization, getSecretKey(environment));
    });

    if (isError(jwtResult)) {
      return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
    }

    if ("/ws" === url.pathname) {
      return handleWebSocket(request, environment);
    }

    return createJsonResponse({ error: "Not Found" }, "NOT_FOUND");
  },
} satisfies ExportedHandler<Env>;
