import type { DrizzleD1Database } from "drizzle-orm/d1";

import { courseTrackingTable } from "../db/schema.ts";

export type Database = DrizzleD1Database<{
  courseTrackingTable: typeof courseTrackingTable;
}>;
