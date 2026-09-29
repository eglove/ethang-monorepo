import type { User } from "../../index.ts";
import { type Database } from "../../db/database-schema.ts";
export declare const addSubscriptionMutation: (database: Database, parameters: {
    xmlAddress: string;
}, user: User) => Promise<{
    iconUrl: string | null;
    id: string;
    lastFetchedAt: string | null;
    title: string;
    website: string;
    xmlAddress: string;
}>;
