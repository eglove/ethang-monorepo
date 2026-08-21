import type { Database } from "../types.ts";
export declare const createCurriculumMutation: (database: Database, parameters: {
    learningPathIds?: null | string[];
    name: string;
    url?: null | string;
}) => Promise<import("../../domain/curriculum/state.ts").Curriculum>;
