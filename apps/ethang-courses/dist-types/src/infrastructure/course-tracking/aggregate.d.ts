import { Effect } from "effect";
import type { CourseTrackingCommand } from "../../domain/course-tracking/commands.ts";
import type { CourseTrackingRepo } from "./repo.ts";
import { type CourseTrackingState } from "../../domain/course-tracking/state.ts";
export declare const carryCourseTrackingCommand: (command: CourseTrackingCommand, repo: CourseTrackingRepo) => Effect.Effect<{
    readonly id: string;
} & CourseTrackingState, import("../../errors/save-error.ts").SaveError | import("../../errors/fetch-error.ts").FetchError, never>;
