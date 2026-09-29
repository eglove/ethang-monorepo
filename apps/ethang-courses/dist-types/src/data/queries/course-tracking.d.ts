import { Effect } from "effect";
import type { Database } from "../types.ts";
export declare const courseTrackingQuery: (database: Database, parameters: {
    courseId: string;
    userId: string;
}) => Effect.Effect<{
    courseUrl: string;
    id: string;
    status: string;
    userId: string;
} | null, import("../../errors/fetch-error.ts").FetchError | import("../../errors/not-found-error.ts").NotFoundError, never>;
