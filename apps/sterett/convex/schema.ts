import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  events: defineTable({
    description: v.string(),
    endsAt: v.string(),
    startsAt: v.string(),
    title: v.string(),
    type: v.string(),
  }),
});
