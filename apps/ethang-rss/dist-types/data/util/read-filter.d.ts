import { type Database } from "../../db/database-schema.ts";
export declare const getReadStateFilter: (database: Database, userId: string, options?: {
    isRead?: boolean | null;
}) => import("drizzle-orm").SQL<unknown> | null;
