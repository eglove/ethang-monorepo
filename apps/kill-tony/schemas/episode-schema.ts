import z from "zod";

import { appearanceSchema } from "./appearance-schema.ts";

export const episodeSchema = z.object({
  appearances: z.array(appearanceSchema),
  number: z.number(),
  publishDate: z.string(),
  title: z.string(),
  url: z.url(),
});

export const createEpisodeSchema = episodeSchema.extend({
  appearances: z.array(appearanceSchema.omit({ id: true })),
});
