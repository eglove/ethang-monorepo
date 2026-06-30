import { Effect } from "effect";

import type { Database } from "../types.ts";

import { getCourseUrlByCourseId } from "../functions/get-course-url-by-course-id.ts";
import { getTrackingByUserIdCourseUrl } from "../functions/get-tracking-by-user-id-course-url.ts";

export const courseTrackingQuery = (
  database: Database,
  parameters: { courseId: string; userId: string }
) => {
  return Effect.gen(function* () {
    const courseUrl = yield* getCourseUrlByCourseId(
      database,
      parameters.courseId
    );
    return yield* getTrackingByUserIdCourseUrl(
      database,
      parameters.userId,
      courseUrl
    );
  });
};
