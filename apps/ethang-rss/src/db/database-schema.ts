import type { DrizzleD1Database } from "drizzle-orm/d1";

// eslint-disable-next-line sonar/no-wildcard-import
import * as databaseSchema from "./schema.ts";

// eslint-disable-next-line unicorn/prefer-export-from
export { databaseSchema };

export type Database = DrizzleD1Database<typeof databaseSchema>;
