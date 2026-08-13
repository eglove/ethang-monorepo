import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.mdx" }),
  schema: z.object({
    blogCategory: z.string().optional(),
    pubDate: z.coerce.date(),
    slug: z.string(),
    title: z.string(),
    updatedDate: z.coerce.date().optional()
  })
});

export const collections = { blog };
