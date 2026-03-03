import { drizzle } from "drizzle-orm/d1";

import type { AuthContext } from "./services/auth-service.js";

import { user } from "./db/schema.js";

export const getDatabase = (context: AuthContext) => {
  return drizzle(context.env.DB, {
    schema: { userTable: user },
  });
};
