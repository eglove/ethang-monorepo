import { eq } from "drizzle-orm";

import type { Database } from "../types.ts";

import { coursesTable } from "../../db/schema.ts";

export const getCourseUrlByCourseId = async (
  database: Database,
  courseId: string
) => {
  const course = await database
    .select({ url: coursesTable.url })
    .from(coursesTable)
    .where(eq(coursesTable.id, courseId))
    .limit(1);
  if (0 === course.length || undefined === course[0])
    throw new Error("Course not found");
  return course[0].url;
};
