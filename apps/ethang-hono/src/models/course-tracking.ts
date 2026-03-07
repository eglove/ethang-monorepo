import { eq } from "drizzle-orm";

import type { getDatabase } from "../db/database.ts";

import { courseTrackingTable } from "../db/schema.ts";
import { COURSE_TRACKING_STATUS } from "../utilities/constants.ts";

export class CourseTracking {
  public constructor(
    private readonly _database: ReturnType<typeof getDatabase>,
  ) {}

  public createCourseTracking(userId: string, courseId: string) {
    return this._database.insert(courseTrackingTable).values({
      courseId,
      status: COURSE_TRACKING_STATUS.INCOMPLETE,
      userId,
    });
  }

  public getCourseTrackingByUserId(userId: string) {
    return this._database.query.courseTrackingTable.findMany({
      where: (table, operators) => {
        return operators.eq(table.userId, userId);
      },
    });
  }

  public getCourseTrackingByUserIdCourseId(userId: string, courseId: string) {
    return this._database.query.courseTrackingTable.findFirst({
      where: (table, operators) => {
        return operators.and(
          operators.eq(table.userId, userId),
          operators.eq(table.courseId, courseId),
        );
      },
    });
  }

  public updateCourseTrackingStatus(id: string, status: string) {
    return this._database
      .update(courseTrackingTable)
      .set({
        status,
      })
      .where(eq(courseTrackingTable.id, id));
  }
}
