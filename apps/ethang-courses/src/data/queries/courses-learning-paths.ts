import { asc, eq } from "drizzle-orm";
import { Effect } from "effect";
import filter from "lodash/filter.js";
import flatMap from "lodash/flatMap.js";
import isError from "lodash/isError.js";
import map from "lodash/map.js";

import type { Database } from "../types.ts";

import {
  coursesTable,
  curriculumLearningPathsTable,
  learningPathCoursesTable,
  learningPathsTable
} from "../../db/schema.ts";

export const coursesQuery = (database: Database, _parameters: null) => {
  return Effect.tryPromise({
    catch: (cause) => {
      return isError(cause) ? cause : new Error(String(cause));
    },
    try: () => {
      return database.select().from(coursesTable);
    }
  });
};

export const courseQuery = (database: Database, courseId: string) => {
  return Effect.tryPromise({
    catch: (cause) => {
      return isError(cause) ? cause : new Error(String(cause));
    },
    try: async () => {
      const [result] = await database
        .select()
        .from(coursesTable)
        .where(eq(coursesTable.id, courseId))
        .limit(1);

      return result ?? null;
    }
  });
};

/** Build the ordered list of courses for a learning path. Filters out any courses
not present in `courseMap` (the caller is expected to have pre-loaded the map).
Exported for unit testing.
*/
export const buildOrderedCourses = (
  coursesInPath: { courseId: string }[],
  courseMap: Map<string, typeof coursesTable.$inferSelect>
) => {
  return map(
    filter(coursesInPath, (lpc) => {
      return courseMap.has(lpc.courseId);
    }),
    (lpc) => {
      const course = courseMap.get(lpc.courseId);
      // v8 ignore next -- defensive guard: filter above guarantees courseMap.has(lpc.courseId)
      if (!course) {
        return Effect.runSync(Effect.die(new Error("Course not found in map")));
      }
      return {
        author: course.author,
        createdAt: course.createdAt,
        id: course.id,
        name: course.name,
        updatedAt: course.updatedAt,
        url: course.url
      };
    }
  );
};

/** Fetch all learning path course rows plus the matching course records so the
caller can render the path in order. Exported for unit testing.
*/
export const fetchLpData = async (database: Database, lpId: string) => {
  const coursesInPath = await database
    .select()
    .from(learningPathCoursesTable)
    .where(eq(learningPathCoursesTable.learningPathId, lpId))
    .orderBy(asc(learningPathCoursesTable.orderRank));

  const courseIds = new Set(map(coursesInPath, "courseId"));

  if (0 === courseIds.size) {
    return { orderedCourses: [] };
  }

  // Fetch all courses and filter in-memory to avoid D1's 100 bound parameter limit
  const allCourseRecords = await database.select().from(coursesTable);
  const courseRecords = filter(allCourseRecords, (c) => {
    return courseIds.has(c.id);
  });

  const courseMap = new Map(
    map(courseRecords, (course) => {
      return [course.id, course] as const;
    })
  );

  return { orderedCourses: buildOrderedCourses(coursesInPath, courseMap) };
};

export const learningPathsQuery = (database: Database, _parameters: null) => {
  return Effect.tryPromise({
    catch: (cause) => {
      return isError(cause) ? cause : new Error(String(cause));
    },
    try: async () => {
      const learningPaths = await database.select().from(learningPathsTable);
      return Promise.all(
        map(learningPaths, async (lp) => {
          const { orderedCourses } = await fetchLpData(database, lp.id);
          return {
            courses: orderedCourses,
            createdAt: lp.createdAt,
            id: lp.id,
            name: lp.name,
            swebokFocus: lp.swebokFocus,
            updatedAt: lp.updatedAt,
            url: lp.url ?? null
          };
        })
      );
    }
  });
};

export const learningPathQuery = (
  database: Database,
  learningPathId: string
) => {
  return Effect.tryPromise({
    catch: (cause) => {
      return isError(cause) ? cause : new Error(String(cause));
    },
    try: async () => {
      const [lpRecord] = await database
        .select()
        .from(learningPathsTable)
        .where(eq(learningPathsTable.id, learningPathId))
        .limit(1);

      if (!lpRecord) {
        return null;
      }

      const { orderedCourses } = await fetchLpData(database, lpRecord.id);

      return {
        courses: orderedCourses,
        createdAt: lpRecord.createdAt,
        id: lpRecord.id,
        name: lpRecord.name,
        swebokFocus: lpRecord.swebokFocus,
        updatedAt: lpRecord.updatedAt,
        url: lpRecord.url ?? null
      };
    }
  });
};

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
export const buildCourseEntry = (
  lpc: typeof learningPathCoursesTable.$inferSelect,
  index: number,
  courseMap: Map<string, typeof coursesTable.$inferSelect>,
  learningPathMap: Map<string, typeof learningPathsTable.$inferSelect>
) => {
  const course = courseMap.get(lpc.courseId);

  if (!course) {
    return null;
  }

  const learningPath = learningPathMap.get(lpc.learningPathId);

  return {
    author: course.author,
    courseId: course.id,
    courseIndex: index,
    learningPathId: lpc.learningPathId,
    learningPathName: learningPath?.name ?? null,
    learningPathOrder: lpc.orderRank,
    learningPathUrl: learningPath?.url ?? null,
    name: course.name,
    swebokFocus: learningPath?.swebokFocus ?? null,
    updatedAt: course.updatedAt,
    url: course.url
  };
};

/** Group learning-path-course rows by learning path id. Exported for unit
testing.
*/
export const groupCoursesByLp = (
  learningPathCourses: (typeof learningPathCoursesTable.$inferSelect)[]
) => {
  const coursesByLp = new Map<
    string,
    (typeof learningPathCoursesTable.$inferSelect)[]
  >();
  for (const lpc of learningPathCourses) {
    const existing = coursesByLp.get(lpc.learningPathId);
    if (existing) {
      existing.push(lpc);
    } else {
      coursesByLp.set(lpc.learningPathId, [lpc]);
    }
  }
  return coursesByLp;
};

/** Build a map from learning-path id to its first curriculum order rank. The
first rank wins; subsequent entries for the same learning path are ignored.
Exported for unit testing.
*/
export const buildLpCurriculumOrder = (
  curriculumLearningPaths: (typeof curriculumLearningPathsTable.$inferSelect)[]
) => {
  const lpCurriculumOrder = new Map<string, number>();
  for (const clp of curriculumLearningPaths) {
    if (!lpCurriculumOrder.has(clp.learningPathId)) {
      lpCurriculumOrder.set(clp.learningPathId, clp.orderRank);
    }
  }
  return lpCurriculumOrder;
};

/** Flatten sorted learning-path ids into a fully-populated array of course
entries. Exported for unit testing.
*/
export const buildAllCoursesFromSortedLpIds = (
  sortedLpIds: string[],
  coursesByLp: Map<string, (typeof learningPathCoursesTable.$inferSelect)[]>,
  courseMap: Map<string, typeof coursesTable.$inferSelect>,
  learningPathMap: Map<string, typeof learningPathsTable.$inferSelect>
) => {
  const entries = flatMap(sortedLpIds, (lpId) => {
    // v8 ignore next -- defensive guard: sortedLpIds is derived from coursesByLp.keys() so every id is defined
    return coursesByLp.get(lpId) ?? [];
  });
  const allCourses: LearningPathCourseEntry[] = [];
  let courseIndex = 0;

  for (const lpc of entries) {
    courseIndex += 1;
    const result = buildCourseEntry(
      lpc,
      courseIndex,
      courseMap,
      learningPathMap
    );
    if (result) {
      allCourses.push(result);
    }
  }

  return allCourses;
};

export const coursesAllQuery = (database: Database, _parameters: null) => {
  return Effect.tryPromise({
    catch: (cause) => {
      return isError(cause) ? cause : new Error(String(cause));
    },
    try: async () => {
      // Fetch all learning path course relationships with order
      const learningPathCourses = await database
        .select()
        .from(learningPathCoursesTable)
        .orderBy(
          asc(learningPathCoursesTable.learningPathId),
          asc(learningPathCoursesTable.orderRank)
        );

      if (0 === learningPathCourses.length) {
        return [];
      }

      // Fetch all courses and learning paths (small tables, avoids D1's 100 bound parameter limit with inArray)
      const courseRecords = await database.select().from(coursesTable);
      const learningPathRecords = await database
        .select()
        .from(learningPathsTable);

      // Fetch curriculum learning path ordering to sort learning paths correctly
      const curriculumLearningPaths = await database
        .select()
        .from(curriculumLearningPathsTable)
        .orderBy(asc(curriculumLearningPathsTable.orderRank));

      const lpCurriculumOrder = buildLpCurriculumOrder(curriculumLearningPaths);

      const courseMap = new Map(
        map(courseRecords, (course) => {
          return [course.id, course] as const;
        })
      );

      const learningPathMap = new Map(
        map(learningPathRecords, (lp) => {
          return [lp.id, lp] as const;
        })
      );

      const coursesByLp = groupCoursesByLp(learningPathCourses);

      // Sort learning path IDs by curriculum order (or fall back to learning path ID)
      const sortedLpIds = coursesByLp
        .keys()
        .toArray()
        .toSorted((a, b) => {
          const orderA = lpCurriculumOrder.get(a) ?? Number.MAX_SAFE_INTEGER;
          const orderB = lpCurriculumOrder.get(b) ?? Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        });

      return buildAllCoursesFromSortedLpIds(
        sortedLpIds,
        coursesByLp,
        courseMap,
        learningPathMap
      );
    }
  });
};
