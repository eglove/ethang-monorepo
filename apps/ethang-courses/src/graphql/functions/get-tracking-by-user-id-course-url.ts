import { courseTrackingTable } from "../../db/schema.ts";
import type { Database } from "../types.ts";

export const getTrackingByUserIdCourseUrl = async (
  database: Database,
  userId: string,
  courseUrl: string
) => {
  return database.query.courseTrackingTable.findFirst({
    where: (table, operators) => {
      return operators.and(
        operators.eq(table.userId, userId),
        operators.eq(table.courseUrl, courseUrl)
      );
    }
  });
};

export type CourseTrackingRecord = typeof courseTrackingTable.$inferSelect;
