import { cycleCourseTrackingStatusMutation } from "./mutations/cycle-course-tracking-status.ts";
import { courseTrackingQuery } from "./queries/course-tracking.ts";
import { courseTrackingsQuery } from "./queries/course-trackings.ts";
import type { Database } from "./types.ts";

export const createResolvers = (database: Database) => {
  return {
    Mutation: {
      cycleCourseTrackingStatus: cycleCourseTrackingStatusMutation(database)
    },
    Query: {
      courseTracking: courseTrackingQuery(database),
      courseTrackings: courseTrackingsQuery(database)
    }
  };
};
