import { eq } from "drizzle-orm";

import type { getDatabase } from "../db/database.ts";

import { courseTrackingTable } from "../db/schema.ts";
import { CoursePathStore } from "../stores/course-path-store.ts";
import { COURSE_TRACKING_STATUS } from "../utilities/constants.ts";

export class CourseTracking {
  public constructor(
    private readonly _database: ReturnType<typeof getDatabase>,
  ) {}

  public async createCourseTracking(userId: string, courseId: string) {
    const courseUrl = await this.getCourseUrl(courseId);

    return this._database.insert(courseTrackingTable).values({
      courseUrl,
      status: COURSE_TRACKING_STATUS.COMPLETE,
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

  public async getCourseTrackingByUserIdCourseId(
    userId: string,
    courseId: string,
  ) {
    const courseUrl = await this.getCourseUrl(courseId);

    return this._database.query.courseTrackingTable.findFirst({
      where: (table, operators) => {
        return operators.and(
          operators.eq(table.userId, userId),
          operators.eq(table.courseUrl, courseUrl),
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

  private async getCourseUrl(courseId: string) {
    const coursePathStore = new CoursePathStore();
    const course = await coursePathStore.queryCourse(courseId);
    return course.url;
  }
}
