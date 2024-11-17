import { query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (context) => {
    return context.db.query("tasks").collect();
  },
});
