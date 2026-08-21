import { Effect } from "effect";
import type { Database } from "../../data/types.ts";
import type { CourseTrackingCommand } from "../../domain/course-tracking/commands.ts";
import type { CourseTrackingState } from "../../domain/course-tracking/state.ts";
import { FetchError } from "../../errors/fetch-error.ts";
import { SaveError } from "../../errors/save-error.ts";
export type CourseTrackingRepo = {
    readonly fetch: (command: CourseTrackingCommand) => Effect.Effect<({
        readonly id: string;
    } & CourseTrackingState) | null, FetchError>;
    readonly save: (state: CourseTrackingState, version: null | string) => Effect.Effect<{
        readonly id: string;
    } & CourseTrackingState, SaveError>;
};
export declare const createCourseTrackingRepo: (database: Database) => {
    fetch: (command: CourseTrackingCommand) => Effect.Effect<{
        courseUrl: string;
        id: string;
        status: "COMPLETE" | "INCOMPLETE" | "REVISIT";
        userId: string;
    } | null, FetchError, never>;
    save: (state: CourseTrackingState, version: null | string) => Effect.Effect<{
        courseUrl: string;
        id: string;
        status: "COMPLETE" | "INCOMPLETE" | "REVISIT";
        userId: string;
    }, SaveError, never>;
};
