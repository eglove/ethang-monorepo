import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { v7 } from "uuid";

export const courseTrackingTable = sqliteTable("courseTracking", {
  courseId: text("courseId").notNull(),
  id: text("id")
    .primaryKey()
    .$defaultFn(() => v7()),
  status: text("status").notNull(),
  userId: text("userId").notNull(),
});
