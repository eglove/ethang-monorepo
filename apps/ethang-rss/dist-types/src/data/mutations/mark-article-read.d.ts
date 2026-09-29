import type { User } from "../../index.ts";
import { type Database } from "../../db/database-schema.ts";
export declare const markArticleReadMutation: (database: Database, parameters: {
    articleId: string;
    isRead: boolean;
}, user: User) => Promise<{
    content: string | null;
    feedId: string;
    guid: string;
    id: string;
    link: string;
    publishedAt: string | null;
    title: string;
} | undefined>;
