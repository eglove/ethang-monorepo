import { z } from "zod";

export const newsSchema = z.object({
  href: z.string(),
  id: z.string(),
  published: z.string(),
  quote: z.string().optional().nullable(),
  title: z.string(),
  youtubeVideo: z
    .object({
      id: z.string(),
      title: z.string(),
      url: z.string(),
      videoId: z.string(),
    })
    .optional()
    .nullable(),
});

export type NewsSchema = z.output<typeof newsSchema>;
