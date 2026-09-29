import { type Database } from "../../db/database-schema.ts";
export declare const subscriptionQuery: (database: Database, parameters: {
    feedId: string;
}) => Promise<{
    iconUrl: string | null;
    id: string;
    lastFetchedAt: string | null;
    title: string;
    website: string;
    xmlAddress: string;
} | null>;
