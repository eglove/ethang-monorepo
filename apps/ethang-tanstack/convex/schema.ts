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
  certification: defineTable({
    description: v.string(),
    expiresOn: v.optional(v.string()),
    issuedBy: v.string(),
    issuedOn: v.string(),
    name: v.string(),
    url: v.string(),
  }),
  course: defineTable({
    name: v.string(),
    url: v.string(),
  }).index("by_name", ["name"]),
  courseSection: defineTable({
    courses: v.array(v.id("course")),
    order: v.optional(v.number()),
    title: v.string(),
  }),
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
  learningProfile: defineTable({
    name: v.string(),
    url: v.string(),
  }),
  methodology: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),
  project: defineTable({
    description: v.string(),
    name: v.string(),
    url: v.string(),
  }),
  technology: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),
});
