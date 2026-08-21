import type { User } from "../../index.ts";
import { type Database } from "../../db/database-schema.ts";
export declare const removeSubscriptionMutation: (database: Database, parameters: {
    feedId: string;
}, user: User) => Promise<void>;
