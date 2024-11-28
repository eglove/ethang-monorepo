/* eslint-disable unicorn/filename-case */
import { query } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (context) => {
    return context.db.query("learningProfile").collect();
  },
});
