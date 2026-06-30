import { drizzle } from "drizzle-orm/d1";

import { user } from "./db/schema.js";

export const getDatabase = (database: D1Database) => {
  return drizzle(database, {
    schema: { userTable: user }
  });
};
