import { Effect } from "effect";
import type { Database } from "../types.ts";
export declare const curriculumsQuery: (database: Database, _parameters: null) => Effect.Effect<{
    id: string;
    learningPaths: {
        courses: {
            author: string;
            createdAt: string;
            id: string;
            name: string;
            updatedAt: string;
            url: string;
        }[];
        url: string | null;
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
        swebokFocus: string;
    }[];
    url: string | null;
    createdAt: string;
    name: string;
    updatedAt: string;
}[], Error, never>;
export declare const curriculumQuery: (database: Database, curriculumId: string) => Effect.Effect<{
    id: string;
    learningPaths: {
        courses: {
            author: string;
            createdAt: string;
            id: string;
            name: string;
            updatedAt: string;
            url: string;
        }[];
        url: string | null;
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
        swebokFocus: string;
    }[];
    url: string | null;
    createdAt: string;
    name: string;
    updatedAt: string;
} | null, Error, never>;
