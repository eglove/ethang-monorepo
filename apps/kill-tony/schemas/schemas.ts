import z from "zod";

export const baseAppearanceSchema = z.object({
  id: z.string(),
  isBucketPull: z.boolean(),
  isGoldenTicketWinner: z.boolean(),
  isGuest: z.boolean(),
  isHallOfFame: z.boolean(),
  isRegular: z.boolean(),
  name: z.string(),
});

export const baseAppearancesSchema = z.array(baseAppearanceSchema);

export const baseEpisodeSchema = z.object({
  appearances: baseAppearancesSchema,
  number: z.number(),
  publishDate: z.string(),
  title: z.string(),
  url: z.url(),
});

export const episodeSchemaWithAppearances = baseEpisodeSchema.extend({
  appearances: z.array(baseAppearanceSchema),
});

export const createAppearanceSchema = baseAppearanceSchema.omit({ id: true });
export const createEpisodeSchema = baseEpisodeSchema.extend({
  appearances: z.array(createAppearanceSchema),
});

export const addAppearanceSchema = z.object({
  appearance: baseAppearanceSchema,
  number: z.number(),
});

export const episodesSchemaWithAppearances = z.array(
  episodeSchemaWithAppearances,
);

export const appearanceSchemaWithEpisodes = baseAppearanceSchema.extend({
  episodes: z.array(baseEpisodeSchema),
});

export const appearancesSchemaWithEpisodes = z.array(
  appearanceSchemaWithEpisodes,
);
