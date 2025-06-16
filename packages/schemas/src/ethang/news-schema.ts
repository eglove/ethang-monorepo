import { z } from "zod";

export const newsSchema = z.object({
  href: z.string(),
  id: z.string(),
  published: z.string(),
  quote: z.string().optional().nullable(),
  title: z.string(),
  youtubeVideoId: z.string().optional().nullable(),
});

export type NewsSchema = z.output<typeof newsSchema>;
