import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import z from "zod";

import {
  addAppearanceSchema,
  createAppearanceSchema,
  createEpisodeSchema,
} from "../schemas/schemas.ts";
import { AppearanceService } from "./appearance.ts";
import { EpisodeService } from "./episode.ts";
import { getIsAuthenticated } from "./get-is-authenticated.ts";
import { getPrismaClient } from "./prisma-client.ts";

const app = new Hono<{ Bindings: Env }>();
app.use("*", cors());
app.use("*", async (context, next) => {
  if ("POST" === context.req.method) {
    const userId = await getIsAuthenticated(context.req.raw);

    if (false === userId) {
      return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
    }
  }

  return next();
});

app.get("/api/appearance", async (context) => {
  const prismaClient = getPrismaClient(context.env);
  const appearanceService = new AppearanceService(prismaClient);

  const appearances = await appearanceService.getAll();

  return createJsonResponse(appearances, "OK");
});

app.get(
  "/api/appearance/:name",
  zValidator("param", z.object({ name: z.string() })),
  async (context) => {
    const prismaClient = getPrismaClient(context.env);
    const appearanceService = new AppearanceService(prismaClient);
    const parameters = context.req.valid("param");

    const data = await appearanceService.getByName(parameters.name);
    return createJsonResponse(data, "OK");
  },
);

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

app.get("/api/episode", async (context) => {
  const prismaClient = getPrismaClient(context.env);
  const episodeService = new EpisodeService(prismaClient);
  const episodes = await episodeService.getAll();

  return createJsonResponse(episodes, "OK");
});

app.get(
  "/api/episode/:number",
  zValidator("param", z.object({ number: z.string() })),
  async (context) => {
    const prismaClient = getPrismaClient(context.env);
    const episodeService = new EpisodeService(prismaClient);
    const parameters = context.req.valid("param");

    const episode = await episodeService.getEpisodeByNumber(
      Number(parameters.number),
    );
    return createJsonResponse(episode, "OK");
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

app.post(
  "/api/episode/appearance",
  zValidator("json", addAppearanceSchema),
  async (context) => {
    const prismaClient = getPrismaClient(context.env);
    const episodeService = new EpisodeService(prismaClient);
    const body = context.req.valid("json");

    const episode = await episodeService.addAppearance(body);
    return createJsonResponse(episode, "OK");
  },
);

export default app;
