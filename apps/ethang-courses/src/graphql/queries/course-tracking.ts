import type { Database } from "../types.ts";
import { getCourseUrlByCourseId } from "../functions/get-course-url-by-course-id.ts";
import { getTrackingByUserIdCourseUrl } from "../functions/get-tracking-by-user-id-course-url.ts";

export const courseTrackingQuery = (database: Database) => {
  return async (
    _parent: unknown,
    parameters: {
      courseId: string;
      userId: string;
    }
  ) => {
    const courseUrl = await getCourseUrlByCourseId(parameters.courseId);

    return getTrackingByUserIdCourseUrl(database, parameters.userId, courseUrl);
  };
};
