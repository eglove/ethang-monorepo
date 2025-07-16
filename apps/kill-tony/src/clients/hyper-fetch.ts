import type z from "zod";

import { Client } from "@hyper-fetch/core";

import type {
  appearanceSchema,
  appearancesSchema,
  createAppearanceSchema,
} from "../../schemas/appearance-schema.ts";
import type {
  createEpisodeSchema,
  episodeSchema,
} from "../../schemas/episode-schema.ts";

export const hyperFetchClient = new Client({
  url: "/api",
});

export const getAllAppearances = hyperFetchClient.createRequest<{
  response: z.output<typeof appearancesSchema>;
}>()({
  endpoint: "/appearance",
  method: "GET",
});

export const createAppearance = hyperFetchClient.createRequest<{
  payload: z.output<typeof createAppearanceSchema>;
  response: z.output<typeof appearanceSchema>;
}>()({
  endpoint: "/appearance",
  method: "POST",
});

export const createEpisode = hyperFetchClient.createRequest<{
  payload: z.output<typeof createEpisodeSchema>;
  response: z.output<typeof episodeSchema>;
}>()({
  endpoint: "/episode",
  method: "POST",
});
