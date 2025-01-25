import { ConvexError, v } from "convex/values";
import isNil from "lodash/isNil";

import { query } from "./_generated/server";

export const get = query({
  args: {
    slug: v.string(),
  },
  handler: async (context, _arguments) => {
    const blog = await context.db
      .query("blogMeta")
      .withIndex("by_slug", (q) => {
        return q.eq("slug", _arguments.slug);
      })
      .first();

    if (isNil(blog)) {
      throw new ConvexError("Blog not found");
    }

    return blog;
  },
});

export const getAll = query({
  args: {},
  handler: async (context) => {
    return context.db.query("blogMeta").order("desc").collect();
  },
});
