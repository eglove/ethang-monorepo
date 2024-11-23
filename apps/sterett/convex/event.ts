import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (context) => {
    return context.db.query("events").collect();
  },
});

export const create = mutation({
  args: {},
  handler: async () => {
    //
  },
});
