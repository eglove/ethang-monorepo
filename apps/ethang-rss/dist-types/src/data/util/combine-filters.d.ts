import { type SQL } from "drizzle-orm";
export declare const combineFilters: (first: null | SQL | undefined, second: null | SQL | undefined) => SQL<unknown> | null | undefined;
