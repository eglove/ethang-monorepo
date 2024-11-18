import { ConvexError, v } from "convex/values";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import some from "lodash/some.js";

import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const create = mutation({
  args: {
    email: v.string(),
  },
  // eslint-disable-next-line max-statements
  handler: async (context, _arguments) => {
    const currentUser = await getCurrentUser(context);

    if (isNil(currentUser)) {
      throw new ConvexError("Unauthorized");
    }

    const receiver = await context.db.query("users").withIndex("by_email", (q) => {
      return q.eq("email", _arguments.email);
    })
      .unique();

    if (isNil(receiver)) {
      throw new ConvexError("User not found");
    }

    const requestAlreadySent = await context.db.query("requests").withIndex("by_receiver_sender", (q) => {
      return q.eq("receiver", receiver._id).eq("sender", currentUser._id);
    })
      .first();

    if (!isNil(requestAlreadySent)) {
      throw new ConvexError("Request already sent");
    }

    const requestAlreadyReceived = await context.db.query("requests").withIndex("by_receiver_sender", (q) => {
      return q.eq("receiver", currentUser._id).eq("sender", receiver._id);
    })
      .first();

    if (!isNil(requestAlreadyReceived)) {
      throw new ConvexError("This user already sent you a request");
    }

    const [friendsA, friendsB] = await Promise.all([
      context.db.query("friends").withIndex("by_userA", (q) => {
        return q.eq("userA", currentUser._id);
      })
        .collect(),
      context.db.query("friends").withIndex("by_userB", (q) => {
        return q.eq("userB", currentUser._id);
      })
        .collect(),
    ]);

    if (some(friendsA, (friend) => {
      return friend.userB === receiver._id;
    }) || some(friendsB, (friend) => {
      return friend.userA === receiver._id;
    })) {
      throw new ConvexError("You are already friends");
    }

    return context.db.insert("requests", {
      receiver: receiver._id,
      sender: currentUser._id,
    });
  },
});

export const get = query({
  handler: async (context, _arguments) => {
    const currentUser = await getCurrentUser(context);

    if (isNil(currentUser)) {
      throw new ConvexError("Unauthorized");
    }

    const requests = await context.db.query("requests").withIndex("by_receiver", (q) => {
      return q.eq("receiver", currentUser._id);
    })
      .collect();

    return Promise.all(
      map(requests, async (request) => {
        const sender = await context.db.get(request.sender);

        if (isNil(sender)) {
          throw new ConvexError("Request sender not found");
        }

        return {
          request,
          sender,
        };
      }),
    );
  },
});

export const count = query({
  handler: async (context, _arguments) => {
    const currentUser = await getCurrentUser(context);

    if (isNil(currentUser)) {
      throw new ConvexError("Unauthorized");
    }

    const requests = await context.db.query("requests").withIndex("by_receiver", (q) => {
      return q.eq("receiver", currentUser._id);
    })
      .collect();

    return requests.length;
  },
});

export const reject = mutation({
  args: {
    id: v.id("requests"),
  },
  handler: async (context, _arguments) => {
    const currentUser = await getCurrentUser(context);

    if (isNil(currentUser)) {
      throw new ConvexError("Unauthorized");
    }

    const request = await context.db.get(_arguments.id);

    if (isNil(request) || request.receiver !== currentUser._id) {
      throw new ConvexError("No request found");
    }

    await context.db.delete(request._id);
  },
});

export const accept = mutation({
  args: {
    id: v.id("requests"),
  },
  handler: async (context, _arguments) => {
    const currentUser = await getCurrentUser(context);

    if (isNil(currentUser)) {
      throw new ConvexError("Unauthorized");
    }

    const request = await context.db.get(_arguments.id);

    if (isNil(request) || request.receiver !== currentUser._id) {
      throw new ConvexError("No request found");
    }

    const conversationId = await context.db.insert("conversations", { isGroup: false });

    await Promise.all([
      context.db.insert("friends", {
        conversationId,
        userA: currentUser._id,
        userB: request.sender,
      }),
      context.db.insert("conversationUsers", {
        conversationId,
        userId: currentUser._id,
      }),
      context.db.insert("conversationUsers", {
        conversationId,
        userId: request.sender,
      }),
      context.db.delete(request._id),
    ]);
  },
});
