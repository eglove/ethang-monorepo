import { z } from "zod";

export const createBookmarkSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  userId: z.string(),
});

export const bookmarkSchema = createBookmarkSchema.extend({
  id: z.string(),
});

export const deleteBookmarkSchema = z.object({
  id: z.string(),
  userId: z.string(),
});

export const bookmarksSchema = z.array(bookmarkSchema);

export type Bookmark = z.infer<typeof bookmarkSchema>;
