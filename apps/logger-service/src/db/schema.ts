import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { DateTime } from "effect";

export const logs = sqliteTable(
  "logs",
  {
    environment: text("environment").notNull(),
    id: text("id")
      .primaryKey()
      .$defaultFn(() => {
        return crypto.randomUUID();
      }),
    level: text("level").notNull(),
    message: text("message").notNull(),
    metadata: text("metadata", { mode: "json" }),
    serviceName: text("serviceName").notNull(),
    stack: text("stack"),
    timestamp: text("timestamp")
      .notNull()
      .$defaultFn(() => {
        return DateTime.formatIso(DateTime.unsafeNow());
      })
  },
  (table) => {
    return [
      index("environment_idx").on(table.environment),
      index("level_idx").on(table.level),
      index("service_name_idx").on(table.serviceName),
      index("timestamp_idx").on(table.timestamp)
    ];
  }
);
