import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { Schema } from "effect";
export declare const fetchSingleFeed: (database: Pick<ReturnType<typeof drizzle>, "delete" | "insert" | "select" | "update">, feed: {
    id: string;
    xmlAddress: string;
}) => Promise<void>;
declare const FeedItemSchema: Schema.Struct<{
    content: Schema.optional<Schema.Union<[typeof Schema.String, Schema.Struct<{
        "#text": Schema.optional<typeof Schema.String>;
    }>]>>;
    description: Schema.optional<typeof Schema.String>;
    guid: Schema.optional<Schema.Union<[typeof Schema.String, Schema.Struct<{
        "#text": Schema.optional<typeof Schema.String>;
    }>]>>;
    id: Schema.optional<typeof Schema.String>;
    link: Schema.optional<Schema.Union<[typeof Schema.String, Schema.Struct<{
        "@_href": Schema.optional<typeof Schema.String>;
        "@_rel": Schema.optional<typeof Schema.String>;
    }>, Schema.Array$<Schema.Union<[typeof Schema.String, Schema.Struct<{
        "@_href": Schema.optional<typeof Schema.String>;
        "@_rel": Schema.optional<typeof Schema.String>;
    }>]>>]>>;
    pubDate: Schema.optional<typeof Schema.String>;
    published: Schema.optional<typeof Schema.String>;
    summary: Schema.optional<typeof Schema.String>;
    title: Schema.optional<Schema.Union<[typeof Schema.String, Schema.Struct<{
        "#text": Schema.optional<typeof Schema.String>;
    }>]>>;
    updated: Schema.optional<typeof Schema.String>;
}>;
type FeedItem = Schema.Schema.Type<typeof FeedItemSchema>;
export declare const normalizeLink: (item: FeedItem) => string;
export declare const normalizeGuid: (item: FeedItem, link: string) => string;
export declare const normalizeContent: (item: FeedItem) => string;
export declare const normalizeTitle: (item: FeedItem) => string;
export declare class FetchFeedsWorkflow extends WorkflowEntrypoint<Env> {
    run(_event: WorkflowEvent<unknown>, step: WorkflowStep): Promise<void>;
}
export {};
