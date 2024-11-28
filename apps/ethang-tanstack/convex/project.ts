import { query } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (context) => {
    return context.db.query("project").collect();
  },
});
