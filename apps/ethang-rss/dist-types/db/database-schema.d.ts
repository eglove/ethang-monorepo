import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as databaseSchema from "./schema.ts";
export { databaseSchema };
export type Database = DrizzleD1Database<typeof databaseSchema>;
