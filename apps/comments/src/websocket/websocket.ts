import { createJsonResponse } from "@ethang/toolbelt/src/fetch/create-json-response.ts";
import { parseJson } from "@ethang/toolbelt/src/json/json.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import values from "lodash/values.js";
import { v7 } from "uuid";
import { z } from "zod";

import { createComment, newCommentSchema } from "../create-comment.js";
import { getComments, getCommentsSchema } from "../get-comments.js";
import { store } from "../index.js";
import { sendToClients } from "./send-to-clients.js";

const socketEventSchema = z.object({
  payload: z.record(z.string(), z.unknown()),
  type: z.string(),
});

const handleMessages = async (
  event: MessageEvent<string>,
  environment: Env,
) => {
  const result = parseJson(event.data, socketEventSchema);

  if (isError(result)) {
    return;
  }

  if ("create-comment" === result.type) {
    const { data, success } = newCommentSchema.safeParse({
      ...result.payload,
      username: "",
    });

    if (!success) {
      sendToClients("create-comment", { error: "Invalid request" });
      return;
    }

    await createComment(data, environment);
  }

  if ("get-comments" === result.type) {
    const { data, success } = getCommentsSchema.safeParse(result.payload);

    if (!success) {
      sendToClients("get-comments", { error: "Invalid request" });
      return;
    }

    await getComments(data, environment);
  }
};

export const handleWebSocket = (request: Request, environment: Env) => {
  const upgradeHeader = request.headers.get("Upgrade");

  if ("websocket" !== upgradeHeader) {
    return createJsonResponse(
      { error: "Expected WebSocket" },
      "UPGRADE_REQUIRED",
      undefined,
      request,
    );
  }

  const [client, server] = values(new WebSocketPair());

  if (isNil(server) || isNil(client)) {
    return createJsonResponse(
      { error: "Failed to create WebSocket" },
      "INTERNAL_SERVER_ERROR",
      undefined,
      request,
    );
  }

  const id = v7();
  store.connections.set(id, server);
  server.accept();

  server.addEventListener("message", (event: MessageEvent<string>) => {
    handleMessages(event, environment).catch(globalThis.console.error);
  });

  server.addEventListener("close", () => {
    store.connections.delete(id);
  });

  server.addEventListener("error", (event) => {
    globalThis.console.error("WebSocket error: ", event);
    store.connections.delete(id);
  });

  return createJsonResponse(
    null,
    "SWITCHING_PROTOCOLS",
    { webSocket: client },
    request,
  );
};
