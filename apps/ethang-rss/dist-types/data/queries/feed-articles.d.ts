import type { User } from "../../index.ts";
import { type Database } from "../../db/database-schema.ts";
export declare const feedArticlesQuery: (database: Database, parameters: {
    after?: string;
    feedId: string;
    first?: number;
    isRead?: boolean;
}, user: User) => Promise<{
    edges: {
        cursor: string;
        node: {
            feed: {
                iconUrl: string | null;
                id: string;
                title: string;
            } | null;
            isRead: boolean;
            content: string | null;
            guid: string;
            id: string;
            link: string;
            publishedAt: string | null;
            title: string;
            __typename: "Article";
        };
    }[];
    pageInfo: {
        endCursor: string | null;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor: string | null;
    };
}>;
