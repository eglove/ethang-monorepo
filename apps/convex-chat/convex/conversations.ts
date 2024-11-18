import { ConvexError } from "convex/values";
import find from "lodash/find.js";
import isNil from "lodash/isNil";
import map from "lodash/map";

import { query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const get = query({
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

    return Promise.all(
      // eslint-disable-next-line max-statements
      map(conversations, async (conversation) => {
        if (isNil(conversation)) {
          throw new ConvexError("Conversation not found");
        }

        if (conversation.isGroup) {
          return { conversation };
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
          otherMember,
        };
      }),
    );
  },
});
