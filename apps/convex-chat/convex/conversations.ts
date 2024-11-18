import { ConvexError, v } from "convex/values";
import find from "lodash/find.js";
import isNil from "lodash/isNil";
import map from "lodash/map";

import type { Id } from "./_generated/dataModel";

import { query, type QueryCtx as QueryContext } from "./_generated/server";
import { getCurrentUser } from "./users";

export const get = query({
  args: { id: v.optional(v.id("messages")) },
  handler: async (context, _arguments) => {
    const currentUser = await getCurrentUser(context);

    if (isNil(currentUser)) {
      throw new ConvexError("Unauthorized");
    }

    const conversationMemberships = await context.db.query("conversationUsers").withIndex("by_userId", (q) => {
      return q.eq("userId", currentUser._id);
    })
      .collect();

    const conversations = await Promise.all(
      map(conversationMemberships, async (membership) => {
        const conversation = context.db.get(membership.conversationId);

        if (isNil(conversation)) {
          throw new ConvexError("Conversation not found");
        }

        return conversation;
      }),
    );

    const lastMessage = await getLastMessageDetails(context, _arguments.id);

    return Promise.all(
      // eslint-disable-next-line max-statements
      map(conversations, async (conversation) => {
        if (isNil(conversation)) {
          throw new ConvexError("Conversation not found");
        }

        if (conversation.isGroup) {
          return {
            conversation,
            lastMessage,
          };
        }

        const allConversationsMemberships = await context.db.query("conversationUsers").withIndex("by_conversationId", (q) => {
          return q.eq("conversationId", conversation._id);
        })
          .collect();

        const otherMembership = find(allConversationsMemberships,
          (membership) => {
            return membership.userId !== currentUser._id;
          });

        if (isNil(otherMembership)) {
          throw new ConvexError("Other member not found");
        }

        const otherMember = await context.db.get(otherMembership.userId);

        if (isNil(otherMember)) {
          throw new ConvexError("Other member not found");
        }

        return {
          conversation,
          lastMessage,
          otherMember,
        };
      }),
    );
  },
});

export const getLastMessageDetails = async (context: QueryContext, id: Id<"messages"> | undefined) => {
  if (isNil(id)) {
    return null;
  }

  const message = await context.db.get(id);

  if (isNil(message)) {
    return null;
  }

  const sender = await context.db.get(message.senderId);

  if (isNil(sender)) {
    return null;
  }

  const content = getMessageContent(message.type, message.content);

  return {
    content,
    sender: sender.email,
  };
};

const getMessageContent = (type: string, content: string[]) => {
  // eslint-disable-next-line sonar/no-small-switch
  switch (type) {
    case "text": {
      return content;
    }

    default: {
      return "[Non-text]";
    }
  }
};
