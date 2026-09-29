import type { drizzle } from "drizzle-orm/d1";
export declare const cleanupOldArticles: (database: Pick<ReturnType<typeof drizzle>, "delete" | "insert" | "select" | "update">, cutoffIso?: null | string) => Promise<void>;
