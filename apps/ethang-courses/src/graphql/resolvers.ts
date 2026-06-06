import type { Database } from "./types.ts";

import { createCurriculumMutation } from "./mutations/create-curriculum.ts";
import { cycleCourseTrackingStatusMutation } from "./mutations/cycle-course-tracking-status.ts";
import { courseTrackingQuery } from "./queries/course-tracking.ts";
import { courseTrackingsQuery } from "./queries/course-trackings.ts";
import {
  courseQuery,
  coursesQuery,
  learningPathQuery,
  learningPathsQuery
} from "./queries/courses-learning-paths.ts";
import { curriculumQuery, curriculumsQuery } from "./queries/curriculums.ts";

export const createResolvers = (database: Database) => {
  return {
    Mutation: {
      createCurriculum: createCurriculumMutation(database),
      cycleCourseTrackingStatus: cycleCourseTrackingStatusMutation(database)
    },
    Query: {
      course: courseQuery(database),
      courses: coursesQuery(database),
      courseTracking: courseTrackingQuery(database),
      courseTrackings: courseTrackingsQuery(database),
      curriculum: curriculumQuery(database),
      curriculums: curriculumsQuery(database),
      learningPath: learningPathQuery(database),
      learningPaths: learningPathsQuery(database)
    }
  };
};
