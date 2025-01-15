import { v7 } from "uuid";
import { z } from "zod";

import { sendToClients } from "./websocket/send-to-clients.js";

export const newCommentSchema = z.object({
  message: z.string(),
  url: z.string().url(),
  username: z.string(),
});

export const createComment = async (
  payload: z.infer<typeof newCommentSchema>,
  environment: Env,
) => {
  await environment.DB.prepare("INSERT INTO Comments (id, message, url, username) VALUES (?, ?, ?, ?)")
    .bind(v7(), payload.message, payload.url, payload.username)
    .first();

  sendToClients("new-comment", { data: payload });
};
