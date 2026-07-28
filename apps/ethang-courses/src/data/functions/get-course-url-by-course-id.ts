import { eq } from "drizzle-orm";
import { Effect } from "effect";

import type { Database } from "../types.ts";

import { courses } from "../../constants/courses.ts";
import { coursesTable } from "../../db/schema.ts";
import { FetchError } from "../../errors/fetch-error.ts";
import { NotFoundError } from "../../errors/not-found-error.ts";

export const getCourseUrlByCourseId = (
  database: Database,
  courseId: string
) => {
  return Effect.gen(function* () {
    const course = yield* Effect.tryPromise({
      catch: (cause) => {
        return new FetchError(String(cause));
      },
      try: () => {
        return database
          .select({ url: coursesTable.url })
          .from(coursesTable)
          .where(eq(coursesTable.id, courseId))
          .limit(1);
      }
    });
    const [row] = course;
    if (!row) {
      return yield* Effect.fail(new NotFoundError(courses.COURSE_NOT_FOUND));
    }
    return row.url;
  });
};
