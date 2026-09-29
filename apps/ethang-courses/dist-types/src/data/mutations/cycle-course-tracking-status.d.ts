import type { Database } from "../types.ts";
export declare const cycleCourseTrackingStatusMutation: (database: Database, parameters: {
    courseId: string;
    userId: string;
}) => Promise<{
    readonly id: string;
} & import("../../domain/course-tracking/state.ts").CourseTrackingState>;
