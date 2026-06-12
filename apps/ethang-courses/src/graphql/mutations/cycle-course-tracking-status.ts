import { eq } from "drizzle-orm";

import type { Database } from "../types.ts";

import { courseTrackingTable } from "../../db/schema.ts";
import { COURSE_TRACKING_STATUS } from "../constants/course-tracking-status.ts";
import { getCourseUrlByCourseId } from "../functions/get-course-url-by-course-id.ts";
import { getNextStatus } from "../functions/get-next-status.ts";
import { getTrackingByUserIdCourseUrl } from "../functions/get-tracking-by-user-id-course-url.ts";

export const cycleCourseTrackingStatusMutation = (database: Database) => {
  return async (
    _parent: unknown,
    parameters: {
      courseId: string;
      userId: string;
    }
  ) => {
    const courseUrl = await getCourseUrlByCourseId(
      database,
      parameters.courseId
    );
    const existing = await getTrackingByUserIdCourseUrl(
      database,
      parameters.userId,
      courseUrl
    );

    if (undefined === existing) {
      // eslint-disable-next-line unicorn/no-unused-array-method-return
      await database.insert(courseTrackingTable).values({
        courseUrl,
        status: COURSE_TRACKING_STATUS.COMPLETE,
        userId: parameters.userId
      });

      return getTrackingByUserIdCourseUrl(
        database,
        parameters.userId,
        courseUrl
      );
    }

    const nextStatus = getNextStatus(existing.status);

    await database
      .update(courseTrackingTable)
      .set({ status: nextStatus })
      .where(eq(courseTrackingTable.id, existing.id));

    return getTrackingByUserIdCourseUrl(database, parameters.userId, courseUrl);
  };
};
