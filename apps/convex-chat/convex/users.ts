import type { UserJSON } from "@clerk/backend";

import { v, type Validator } from "convex/values";

import {
  internalMutation,
  query,
  type QueryCtx as QueryContext,
} from "./_generated/server";

export const current = query({
  args: {},
  handler: async (context) => {
    return getCurrentUser(context);
  },
});

export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> }, // no runtime validation, trust Clerk
  async handler(context, { data }) {
    const userAttributes = {
      clerkId: data.id,
      email: data.email_addresses[0].email_address,
      imageUrl: data.image_url,
      username: data.username ?? "",
    };

    const user = await userByExternalId(context, data.id);
    await (null === user
      ? context.db.insert("users", userAttributes)
      : context.db.patch(user._id, userAttributes));
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(context, { clerkUserId }) {
    const user = await userByExternalId(context, clerkUserId);

    if (null === user) {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`,
      );
    } else {
      await context.db.delete(user._id);
    }
  },
});

export const getCurrentUserOrThrow = async (context: QueryContext) => {
  const userRecord = await getCurrentUser(context);
  if (!userRecord) throw new Error("Can't get current user");
  return userRecord;
};

export const getCurrentUser = async (context: QueryContext) => {
  const identity = await context.auth.getUserIdentity();
  if (null === identity) {
    return null;
  }
  return userByExternalId(context, identity.subject);
};

const userByExternalId = async (
  context: QueryContext,
  externalId: string,
) => {
  return context.db
    .query("users")
    .withIndex("by_clerk_id", (q) => {
      return q.eq("clerkId", externalId);
    })
    .unique();
};
