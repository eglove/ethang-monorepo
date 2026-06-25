import { Effect } from "effect";

import type { Database } from "../types.ts";

import { carryCourseTrackingCommand } from "../../infrastructure/course-tracking/aggregate.ts";
import { createCourseTrackingRepo } from "../../infrastructure/course-tracking/repo.ts";
import { getCourseUrlByCourseId } from "../functions/get-course-url-by-course-id.ts";

export const cycleCourseTrackingStatusMutation = async (
  database: Database,
  parameters: { courseId: string; userId: string }
) => {
  const effect = Effect.gen(function* () {
    const courseUrl = yield* getCourseUrlByCourseId(
      database,
      parameters.courseId
    );
    const command = {
      courseUrl,
      kind: "CycleStatus" as const,
      userId: parameters.userId
    };
    const repo = createCourseTrackingRepo(database);
    return yield* carryCourseTrackingCommand(command, repo);
  });

  return Effect.runPromise(effect);
};
