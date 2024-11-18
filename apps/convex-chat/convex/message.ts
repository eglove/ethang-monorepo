import { ConvexError, v } from "convex/values";
import isNil from "lodash/isNil";
import map from "lodash/map.js";

import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const create = mutation({
  args: {
    content: v.array(v.string()),
    conversationId: v.id("conversations"),
    type: v.string(),
  },
  handler: async (context, _arguments) => {
    const currentUser = await getCurrentUser(context);

    if (isNil(currentUser)) {
      throw new ConvexError("Unauthorized");
    }

    const membership = await context.db.query("conversationUsers")
      .withIndex("by_userId_conversationId", (q) => {
        return q.eq("userId", currentUser._id).eq("conversationId", _arguments.conversationId);
      })
      .unique();

    if (isNil(membership)) {
      throw new ConvexError("Conversation not found");
    }

    const message = await context.db.insert("messages", {
      ..._arguments,
      senderId: currentUser._id,
    });

    await context.db.patch(
      _arguments.conversationId,
      { lastMessageId: message },
    );

    return message;
  },
});

export const get = query({
  args: {
    id: v.id("conversations"),
  },
  handler: async (context, _arguments) => {
    const currentUser = await getCurrentUser(context);

    if (isNil(currentUser)) {
      throw new ConvexError("Unauthorized");
    }

    const messages = await context.db.query("messages")
      .withIndex("by_conversationId", (q) => {
        return q.eq("conversationId", _arguments.id);
      })
      .order("asc")
      .collect();

    return Promise.all(
      map(messages, async (message) => {
        const messageSender = await context.db.get(message.senderId);

        if (isNil(messageSender)) {
          throw new ConvexError("Could not find messages");
        }

        return {
          isCurrentUser: messageSender._id === currentUser._id,
          message,
          senderImage: messageSender.imageUrl,
          senderName: messageSender.email,
        };
      }),
    );
  },
});
