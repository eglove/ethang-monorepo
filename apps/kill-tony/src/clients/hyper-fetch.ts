import type z from "zod";

import { Client } from "@hyper-fetch/core";
import { DevtoolsPlugin } from "@hyper-fetch/plugin-devtools";

import type {
  addAppearanceSchema,
  appearanceSchemaWithEpisodes,
  baseAppearanceSchema,
  baseAppearancesSchema,
  createAppearanceSchema,
  createEpisodeSchema,
  episodeSchemaWithAppearances,
  episodesSchemaWithAppearances,
} from "../../schemas/schemas.ts";

export const hyperFetchClient = new Client({
  url: "/api",
}).addPlugin(DevtoolsPlugin({ appName: "Kill Tony" }));

export const getAllAppearances = hyperFetchClient.createRequest<{
  response: z.output<typeof baseAppearancesSchema>;
}>()({
  endpoint: "/appearance",
  method: "GET",
});

export const getAppearanceByName = hyperFetchClient.createRequest<{
  response: z.output<typeof appearanceSchemaWithEpisodes>;
}>()({
  endpoint: "/appearance/:name",
  method: "GET",
});

export const createAppearance = hyperFetchClient.createRequest<{
  payload: z.output<typeof createAppearanceSchema>;
  response: z.output<typeof baseAppearanceSchema>;
}>()({
  endpoint: "/appearance",
  method: "POST",
});

export const getAllEpisodes = hyperFetchClient.createRequest<{
  response: z.output<typeof episodesSchemaWithAppearances>;
}>()({
  endpoint: "/episode",
  method: "GET",
});

export const getEpisodeByNumber = hyperFetchClient.createRequest<{
  response: z.output<typeof episodeSchemaWithAppearances>;
}>()({
  endpoint: "/episode/:number",
  method: "GET",
});

export const createEpisode = hyperFetchClient.createRequest<{
  payload: z.output<typeof createEpisodeSchema>;
  response: z.output<typeof episodeSchemaWithAppearances>;
}>()({
  endpoint: "/episode",
  method: "POST",
});

export const addAppearanceToEpisode = hyperFetchClient.createRequest<{
  payload: z.output<typeof addAppearanceSchema>;
  response: z.output<typeof episodeSchemaWithAppearances>;
}>()({
  endpoint: "/episode/appearance",
  method: "POST",
});
