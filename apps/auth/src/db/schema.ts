import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { v7 } from "uuid";

export const user = sqliteTable("User", {
  email: text("email").unique().notNull(),
  id: text("id")
    .primaryKey()
    .$defaultFn(() => v7()),
  lastLoggedIn: text("lastLoggedIn"),
  password: text("password").notNull(),
  role: text("role"),
  sessionToken: text("sessionToken"),
  updatedAt: text("updatedAt")
    .notNull()
    .default(sql`(strftime('%Y-%m-%d %H:%M:%f', 'now'))`),
  username: text("username").unique().notNull(),
});
