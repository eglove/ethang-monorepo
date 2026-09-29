import type { User } from "../../index.ts";
import { type Database } from "../../db/database-schema.ts";
export declare const subscriptionsQuery: (database: Database, parameters: {
    after?: null | string;
    first?: number;
    sortBy?: {
        direction: "ASC" | "DESC";
        field: "PUBLISHED_AT" | "TITLE";
    };
}, user: User) => Promise<{
    edges: {
        cursor: string;
        node: {
            __typename: "Feed";
            iconUrl: string | null;
            id: string;
            lastFetchedAt: string | null;
            title: string;
            website: string;
            xmlAddress: string;
        };
    }[];
    pageInfo: {
        endCursor: string | null;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor: string | null;
    };
}>;
