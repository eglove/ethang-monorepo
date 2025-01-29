import { DateTime, Str } from "chanfana";
import { z } from "zod";

export const Task = z.object({
  completed: z.boolean().default(false),
  description: Str({ required: false }),
  due_date: DateTime(),
  name: Str({ example: "lorem" }),
  slug: Str(),
});

export const RssFeedSchema = z.object({
  description: z.string().optional(),
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
});

export const WatcherSchema = z.object({
  id: z.string(),
  name: z.string().url(),
});

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string().url(),
});
