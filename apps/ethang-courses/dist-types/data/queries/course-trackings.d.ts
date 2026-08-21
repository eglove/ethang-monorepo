import { Effect } from "effect";
import type { Database } from "../types.ts";
export declare const courseTrackingsQuery: (database: Database, userId: string) => Effect.Effect<{
    courseUrl: string;
    id: string;
    status: string;
    userId: string;
}[], Error, never>;
