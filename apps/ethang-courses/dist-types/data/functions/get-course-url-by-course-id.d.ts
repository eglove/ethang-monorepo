import { Effect } from "effect";
import type { Database } from "../types.ts";
import { FetchError } from "../../errors/fetch-error.ts";
import { NotFoundError } from "../../errors/not-found-error.ts";
export declare const getCourseUrlByCourseId: (database: Database, courseId: string) => Effect.Effect<string, FetchError | NotFoundError, never>;
