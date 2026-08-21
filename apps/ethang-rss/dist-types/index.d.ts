import { WorkerEntrypoint } from "cloudflare:workers";
export type User = {
    email: string;
    exp: number;
    iat: number;
    sub: string;
    username: string;
};
export default class extends WorkerEntrypoint<Env> {
    addSubscription(parameters: {
        sessionToken: string;
        xmlAddress: string;
    }): Promise<null>;
    allArticles(parameters: {
        after?: string;
        first?: number;
        isRead?: boolean;
        sessionToken: string;
    }): Promise<{
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
    feedArticles(parameters: {
        after?: string;
        feedId: string;
        first?: number;
        isRead?: boolean;
        sessionToken: string;
    }): Promise<{
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
    fetch(_request: Request): Response;
    markArticleRead(parameters: {
        articleId: string;
        isRead: boolean;
        sessionToken: string;
    }): Promise<{
        content: string | null;
        feedId: string;
        guid: string;
        id: string;
        link: string;
        publishedAt: string | null;
        title: string;
    } | undefined>;
    removeSubscription(parameters: {
        feedId: string;
        sessionToken: string;
    }): Promise<null>;
    scheduled(event: ScheduledEvent): Promise<void>;
    subscription(parameters: {
        feedId: string;
    }): Promise<{
        iconUrl: string | null;
        id: string;
        lastFetchedAt: string | null;
        title: string;
        website: string;
        xmlAddress: string;
    } | null>;
    subscriptions(parameters: {
        after?: string;
        first?: number;
        sessionToken: string;
        sortBy?: {
            direction: "ASC" | "DESC";
            field: "PUBLISHED_AT" | "TITLE";
        };
    }): Promise<{
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
}
export { FetchFeedsWorkflow } from "./cron/fetch-feeds-workflow.ts";
