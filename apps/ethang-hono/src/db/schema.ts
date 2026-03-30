import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { v7 } from "uuid";

export const generateCourseTrackingId = () => v7();

export const courseTrackingTable = sqliteTable("courseTracking", {
  courseUrl: text("courseUrl").notNull(),
  id: text("id").primaryKey().$defaultFn(generateCourseTrackingId),
  status: text("status").notNull(),
  userId: text("userId").notNull(),
});
