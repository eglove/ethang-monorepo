import type { UserJSON } from "@clerk/backend";

import { v, type Validator } from "convex/values";
import isNil from "lodash/isNil";

import { internalMutation, internalQuery, type QueryCtx as QueryContext } from "./_generated/server";

export const getCurrentUser = async (context: QueryContext) => {
  const identity = await context.auth.getUserIdentity();

  if (isNil(identity)) {
    return null;
  }

  return getUser(context, { subject: identity.subject });
};

export const getUser = internalQuery({
  args: { subject: v.string() },
  async handler(context, _arguments) {
    return context.db
      .query("user")
      .withIndex("by_clerk_id", (q) => {
        return q.eq("clerkId", _arguments.subject);
      })
      .unique();
  },
});

export const updateOrCreateUser = internalMutation({
  args: { clerkUser: v.any() as Validator<UserJSON> },
  async handler(context, _arguments) {
    globalThis.console.log(_arguments.clerkUser);
    const userAttributes = {
      clerkId: _arguments.clerkUser.id,
      email: _arguments.clerkUser.email_addresses[0].email_address,
      imageUrl: _arguments.clerkUser.image_url,
      username: _arguments.clerkUser.username ?? "",
    };

    const user = await getUser(context, { subject: _arguments.clerkUser.id });
    await (isNil(user)
      ? context.db.insert("user", userAttributes)
      : context.db.patch(user._id, userAttributes));
  },
});

export const deleteUser = internalMutation({
  args: { clerkId: v.string() },
  async handler(context, _arguments) {
    const user = await getUser(context, { subject: _arguments.clerkId });

    if (isNil(user)) {
      globalThis.console.warn("Can't delete user that doesn't exist.");
    } else {
      await context.db.delete(user._id);
    }
  },
});
