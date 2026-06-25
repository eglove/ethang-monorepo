import { DrizzleD1Database } from "drizzle-orm/d1";

import {
  conflictTable,
  modificationListTable as moduleListTable,
  modificationTable as moduleTable,
  patchTable,
  requirementTable
} from "../db/schema.ts";

export type Database = DrizzleD1Database<{
  conflictTable: typeof conflictTable;
  modListTable: typeof moduleListTable;
  modTable: typeof moduleTable;
  patchTable: typeof patchTable;
  requirementTable: typeof requirementTable;
}>;

export type DatabaseTransaction =
  | Database
  | Parameters<Parameters<Database["transaction"]>[0]>[0];

export const TYPE_MARKER = "types";
