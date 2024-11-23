import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  blogMeta: defineTable({
    description: v.string(),
    featuredImage: v.string(),
    publishedAt: v.string(),
    slug: v.string(),
    tags: v.array(v.string()),
    title: v.string(),
    updatedAt: v.string(),
  }).index("by_publishedAt", ["publishedAt"])
    .index("by_updatedAt", ["updatedAt"])
    .index("by_slug", ["slug"]),
  methodology: defineTable({
    name: v.string(),
  }),
  technology: defineTable({
    name: v.string(),
  }),
});
