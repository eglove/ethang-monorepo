import { Effect } from "effect";
import type { courseTrackingTable } from "../../db/schema.ts";
import type { Database } from "../types.ts";
import { FetchError } from "../../errors/fetch-error.ts";
export type CourseTrackingRecord = typeof courseTrackingTable.$inferSelect;
export declare const getTrackingByUserIdCourseUrl: (database: Database, userId: string, courseUrl: string) => Effect.Effect<{
    courseUrl: string;
    id: string;
    status: string;
    userId: string;
} | null, FetchError, never>;
