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
  job: defineTable({
    company: v.string(),
    description: v.string(),
    endDate: v.optional(v.string()),
    methodologiesUsed: v.optional(v.array(v.id("methodology"))),
    startDate: v.string(),
    technologiesUsed: v.optional(v.array(v.id("technology"))),
    title: v.string(),
  }).index("by_title", ["title"])
    .index("by_company", ["company"]),
  methodology: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),
  technology: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),
});
