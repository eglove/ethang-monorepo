import { z } from "zod";

import { sendToClients } from "./websocket/send-to-clients.js";

export const getCommentsSchema = z.object({
  url: z.string().url(),
});

export const getComments = async (
  payload: z.infer<typeof getCommentsSchema>,
  environment: Env,
) => {
  const data = await environment.DB
    .prepare("SELECT * FROM Comments WHERE url = ?")
    .bind(payload.url)
    .all();

  sendToClients("get-comments", { data: data.results });
};
