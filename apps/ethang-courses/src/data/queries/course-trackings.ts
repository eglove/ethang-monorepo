import { eq } from "drizzle-orm";
import { Effect } from "effect";

import type { Database } from "../types.ts";

import { courseTrackingTable } from "../../db/schema.ts";

export const courseTrackingsQuery = (database: Database, userId: string) => {
  return Effect.tryPromise({
    catch: () => {
      return new Error("Failed to fetch course trackings");
    },
    try: () => {
      return database
        .select()
        .from(courseTrackingTable)
        .orderBy(courseTrackingTable.courseUrl)
        .where(eq(courseTrackingTable.userId, userId));
    }
  });
};
