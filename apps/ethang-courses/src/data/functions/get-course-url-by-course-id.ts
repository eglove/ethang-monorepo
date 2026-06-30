import { courses } from "@ethang/intl/en/courses.ts";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import isError from "lodash/isError.js";

import type { Database } from "../types.ts";

import { coursesTable } from "../../db/schema.ts";
import { FetchError } from "../../errors/fetch-error.ts";
import { NotFoundError } from "../../errors/not-found-error.ts";

export const getCourseUrlByCourseId = (
  database: Database,
  courseId: string
) => {
  return Effect.tryPromise({
    catch: (cause) => {
      if (isError(cause) && courses.COURSE_NOT_FOUND === cause.message) {
        return new NotFoundError(cause.message);
      }
      return new FetchError(String(cause));
    },
    try: async () => {
      const course = await database
        .select({ url: coursesTable.url })
        .from(coursesTable)
        .where(eq(coursesTable.id, courseId))
        .limit(1);
      if (0 === course.length || undefined === course[0]) {
        throw new Error(courses.COURSE_NOT_FOUND);
      }
      return course[0].url;
    }
  });
};
