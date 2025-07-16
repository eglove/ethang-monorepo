import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { createAppearanceSchema } from "../schemas/appearance-schema.ts";
import { createEpisodeSchema } from "../schemas/episode-schema.ts";
import { AppearanceService } from "./appearance.ts";
import { EpisodeService } from "./episode.ts";
import { getPrismaClient } from "./prisma-client.ts";

const app = new Hono<{ Bindings: Env }>();
app.use("*", cors());

app.get("/api/appearance", async (context) => {
  const prismaClient = getPrismaClient(context.env);
  const appearanceService = new AppearanceService(prismaClient);

  const appearances = await appearanceService.getAll();

  return createJsonResponse(appearances, "OK");
});

app.post(
  "/api/appearance",
  zValidator("json", createAppearanceSchema),
  async (context) => {
    const prismaClient = getPrismaClient(context.env);
    const appearanceService = new AppearanceService(prismaClient);
    const body = context.req.valid("json");

    const appearance = await appearanceService.createAppearance(body);
    return createJsonResponse(appearance, "OK");
  },
);

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
