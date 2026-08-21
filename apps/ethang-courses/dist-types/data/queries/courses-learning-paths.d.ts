import { Effect } from "effect";
import type { Database } from "../types.ts";
import { coursesTable, curriculumLearningPathsTable, learningPathCoursesTable, learningPathsTable } from "../../db/schema.ts";
export declare const coursesQuery: (database: Database, _parameters: null) => Effect.Effect<{
    author: string;
    createdAt: string;
    id: string;
    name: string;
    updatedAt: string;
    url: string;
}[], Error, never>;
export declare const courseQuery: (database: Database, courseId: string) => Effect.Effect<{
    author: string;
    createdAt: string;
    id: string;
    name: string;
    updatedAt: string;
    url: string;
} | null, Error, never>;
/** Build the ordered list of courses for a learning path. Filters out any courses
not present in `courseMap` (the caller is expected to have pre-loaded the map).
Exported for unit testing.
*/
export declare const buildOrderedCourses: (coursesInPath: {
    courseId: string;
}[], courseMap: Map<string, typeof coursesTable.$inferSelect>) => {
    author: string;
    createdAt: string;
    id: string;
    name: string;
    updatedAt: string;
    url: string;
}[];
/** Fetch all learning path course rows plus the matching course records so the
caller can render the path in order. Exported for unit testing.
*/
export declare const fetchLpData: (database: Database, lpId: string) => Promise<{
    orderedCourses: {
        author: string;
        createdAt: string;
        id: string;
        name: string;
        updatedAt: string;
        url: string;
    }[];
}>;
export declare const learningPathsQuery: (database: Database, _parameters: null) => Effect.Effect<{
    courses: {
        author: string;
        createdAt: string;
        id: string;
        name: string;
        updatedAt: string;
        url: string;
    }[];
    createdAt: string;
    id: string;
    name: string;
    swebokFocus: string;
    updatedAt: string;
    url: string | null;
}[], Error, never>;
export declare const learningPathQuery: (database: Database, learningPathId: string) => Effect.Effect<{
    courses: {
        author: string;
        createdAt: string;
        id: string;
        name: string;
        updatedAt: string;
        url: string;
    }[];
    createdAt: string;
    id: string;
    name: string;
    swebokFocus: string;
    updatedAt: string;
    url: string | null;
} | null, Error, never>;
type LearningPathCourseEntry = {
    author: string;
    courseId: string;
    courseIndex: number;
    learningPathId: string;
    learningPathName: null | string;
    learningPathOrder: number;
    learningPathUrl: null | string;
    name: string;
    swebokFocus: null | string;
    updatedAt: string;
    url: string;
};
/** Build a single learning path course entry (row enriched with course and
learning-path metadata). Returns `null` when the course is missing.
Exported for unit testing.
*/
export declare const buildCourseEntry: (lpc: typeof learningPathCoursesTable.$inferSelect, index: number, courseMap: Map<string, typeof coursesTable.$inferSelect>, learningPathMap: Map<string, typeof learningPathsTable.$inferSelect>) => {
    author: string;
    courseId: string;
    courseIndex: number;
    learningPathId: string;
    learningPathName: string | null;
    learningPathOrder: number;
    learningPathUrl: string | null;
    name: string;
    swebokFocus: string | null;
    updatedAt: string;
    url: string;
} | null;
/** Group learning-path-course rows by learning path id. Exported for unit
testing.
*/
export declare const groupCoursesByLp: (learningPathCourses: (typeof learningPathCoursesTable.$inferSelect)[]) => Map<string, {
    id: string;
    createdAt: string;
    courseId: string;
    learningPathId: string;
    orderRank: number;
}[]>;
/** Build a map from learning-path id to its first curriculum order rank. The
first rank wins; subsequent entries for the same learning path are ignored.
Exported for unit testing.
*/
export declare const buildLpCurriculumOrder: (curriculumLearningPaths: (typeof curriculumLearningPathsTable.$inferSelect)[]) => Map<string, number>;
/** Flatten sorted learning-path ids into a fully-populated array of course
entries. Exported for unit testing.
*/
export declare const buildAllCoursesFromSortedLpIds: (sortedLpIds: string[], coursesByLp: Map<string, (typeof learningPathCoursesTable.$inferSelect)[]>, courseMap: Map<string, typeof coursesTable.$inferSelect>, learningPathMap: Map<string, typeof learningPathsTable.$inferSelect>) => LearningPathCourseEntry[];
export declare const coursesAllQuery: (database: Database, _parameters: null) => Effect.Effect<LearningPathCourseEntry[], Error, never>;
export {};
