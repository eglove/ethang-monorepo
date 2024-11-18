import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  conversations: defineTable({
    isGroup: v.boolean(),
    lastMessageId: v.optional(v.id("messages")),
    name: v.optional(v.string()),
  }),
  conversationUsers: defineTable({
    conversationId: v.id("conversations"),
    lastSeenMessage: v.optional(v.id("messages")),
    userId: v.id("users"),
  }).index("by_userId", ["userId"])
    .index("by_conversationId", ["conversationId"])
    .index("by_userId_conversationId", ["userId", "conversationId"]),
  friends: defineTable({
    conversationId: v.id("conversations"),
    userA: v.id("users"),
    userB: v.id("users"),
  }).index("by_userA", ["userA"])
    .index("by_userB", ["userB"])
    .index("by_conversationId", ["conversationId"]),
  messages: defineTable({
    content: v.array(v.string()),
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    type: v.string(),
  }).index("by_conversationId", ["conversationId"]),
  requests: defineTable({
    receiver: v.id("users"),
    sender: v.id("users"),
  }).index("by_receiver", ["receiver"])
    .index("by_receiver_sender", ["receiver", "sender"]),
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    imageUrl: v.string(),
    username: v.string(),
  }).index("by_email", ["email"])
    .index("by_clerk_id", ["clerkId"]),
});
