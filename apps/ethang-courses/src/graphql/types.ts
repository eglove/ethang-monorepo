import type { DrizzleD1Database } from "drizzle-orm/d1";

import type {
  coursesTable,
  courseTrackingTable,
  learningPathCoursesTable,
  learningPathsTable
} from "../db/schema.ts";

export type Database = DrizzleD1Database<{
  coursesTable: typeof coursesTable;
  courseTrackingTable: typeof courseTrackingTable;
  learningPathCoursesTable: typeof learningPathCoursesTable;
  learningPathsTable: typeof learningPathsTable;
}>;
