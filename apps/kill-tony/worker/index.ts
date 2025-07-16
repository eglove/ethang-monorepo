import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { createEpisodeSchema, EpisodeService } from "./episode.ts";
import { getPrismaClient } from "./prisma-client.ts";

const app = new Hono<{ Bindings: Env }>();
app.use("*", cors());

app.get("/api/", (context) => {
  return Response.json({
    name: "Cloudflare",
  });
});

app.post(
  "/api/episode",
  zValidator("json", createEpisodeSchema),
  async (context) => {
    const prismaClient = getPrismaClient(context.env);
    const episodeService = new EpisodeService(prismaClient);
    const body = context.req.valid("json");

    const episode = await episodeService.createEpisode(body);

    return createJsonResponse(episode, "OK");
  },
);

export default app;
