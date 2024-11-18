import { ConvexError, v } from "convex/values";
import find from "lodash/find";
import isNil from "lodash/isNil";

import { query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const get = query({
  args: {
    id: v.id("conversations"),
  },
  // eslint-disable-next-line max-statements
  handler: async (context, _arguments) => {
    const currentUser = await getCurrentUser(context);

    if (isNil(currentUser)) {
      throw new ConvexError("Unauthorized");
    }

    const conversation = await context.db.get(_arguments.id);

    if (isNil(conversation)) {
      throw new ConvexError("Conversation not found");
    }

    const membership = await context.db.query("conversationUsers")
      .withIndex("by_userId_conversationId", (q) => {
        return q.eq("userId", currentUser._id).eq("conversationId", conversation._id);
      })
      .unique();

    if (isNil(membership)) {
      throw new ConvexError("Conversation not found");
    }

    const allConversationMemberships = await context.db.query("conversationUsers")
      .withIndex("by_conversationId", (q) => {
        return q.eq("conversationId", _arguments.id);
      })
      .collect();

    if (!conversation.isGroup) {
      const otherMembership = find(allConversationMemberships,
        (_membership) => {
          return _membership.userId !== currentUser._id;
        });

      if (isNil(otherMembership)) {
        throw new ConvexError("Other user not found");
      }

      const otherMemberDetails = await context.db.get(otherMembership.userId);

      return {
        ...conversation,
        otherMember: {
          ...otherMemberDetails,
          lastSeenMessageId: otherMembership.lastSeenMessage,
        },
        otherMembers: null,
      };
    }
  },
});
