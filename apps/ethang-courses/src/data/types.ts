import type { DrizzleD1Database } from "drizzle-orm/d1";

import type {
  coursesTable,
  courseTrackingTable,
  curriculumLearningPathsTable,
  curriculumsTable,
  learningPathCoursesTable,
  learningPathsTable
} from "../db/schema.ts";

export type Database = DrizzleD1Database<{
  coursesTable: typeof coursesTable;
  courseTrackingTable: typeof courseTrackingTable;
  curriculumLearningPathsTable: typeof curriculumLearningPathsTable;
  curriculumsTable: typeof curriculumsTable;
  learningPathCoursesTable: typeof learningPathCoursesTable;
  learningPathsTable: typeof learningPathsTable;
}>;

export type DatabaseTransaction =
  | Database
  | Parameters<Parameters<Database["transaction"]>[0]>[0];
