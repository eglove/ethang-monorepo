import type { Database } from "../types.ts";

import { getCourseUrlByCourseId } from "../functions/get-course-url-by-course-id.ts";
import { getTrackingByUserIdCourseUrl } from "../functions/get-tracking-by-user-id-course-url.ts";

export const courseTrackingQuery = async (
  database: Database,
  parameters: { courseId: string; userId: string }
) => {
  const courseUrl = await getCourseUrlByCourseId(database, parameters.courseId);

  return getTrackingByUserIdCourseUrl(database, parameters.userId, courseUrl);
};
