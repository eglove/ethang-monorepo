import { Effect } from "effect";

import type { courseTrackingTable } from "../../db/schema.ts";
import type { Database } from "../types.ts";

import { FetchError } from "../../errors/fetch-error.ts";

export type CourseTrackingRecord = typeof courseTrackingTable.$inferSelect;

export const getTrackingByUserIdCourseUrl = (
  database: Database,
  userId: string,
  courseUrl: string
) => {
  return Effect.tryPromise({
    catch: (cause) => {
      return new FetchError(String(cause));
    },
    try: async () => {
      const result = await database.query.courseTrackingTable.findFirst({
        where: (table, operators) => {
          return operators.and(
            operators.eq(table.userId, userId),
            operators.eq(table.courseUrl, courseUrl)
          );
        }
      });

      return result ?? null;
    }
  });
};
