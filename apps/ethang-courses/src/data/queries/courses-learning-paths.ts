import { asc, eq } from "drizzle-orm";
import { Effect } from "effect";
import filter from "lodash/filter.js";
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

const buildOrderedCourses = (
  coursesInPath: { courseId: string }[],
  courseMap: Map<string, typeof coursesTable.$inferSelect>
) => {
  return map(
    filter(coursesInPath, (lpc) => {
      return courseMap.has(lpc.courseId);
    }),
    (lpc) => {
      const courseEntry = courseMap.get(lpc.courseId);
      if (!courseEntry) {
        throw new Error("Course not found in map");
      }
      const course = courseEntry;
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

const fetchLpData = async (database: Database, lpId: string) => {
  const coursesInPath = await database
    .select()
    .from(learningPathCoursesTable)
    .where(eq(learningPathCoursesTable.learningPathId, lpId))
    .orderBy(asc(learningPathCoursesTable.orderRank));

  const courseIds = new Set(
    map(coursesInPath, (lpc) => {
      return lpc.courseId;
    })
  );

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

const buildCourseEntry = (
  lpc: typeof learningPathCoursesTable.$inferSelect,
  index: number,
  courseMap: Map<string, typeof coursesTable.$inferSelect>,
  learningPathMap: Map<string, typeof learningPathsTable.$inferSelect>
): LearningPathCourseEntry | null => {
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

      // Build a map of learning path ID → its first curriculum order rank (or null if not in curriculum)
      const lpCurriculumOrder = new Map<string, number>();
      for (const clp of curriculumLearningPaths) {
        if (!lpCurriculumOrder.has(clp.learningPathId)) {
          lpCurriculumOrder.set(clp.learningPathId, clp.orderRank);
        }
      }

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

      // Group courses by learning path, preserving order within each path
      const coursesByLp = new Map<string, typeof learningPathCourses>();
      for (const lpc of learningPathCourses) {
        const existing = coursesByLp.get(lpc.learningPathId);
        if (existing) {
          existing.push(lpc);
        } else {
          coursesByLp.set(lpc.learningPathId, [lpc]);
        }
      }

      // Sort learning path IDs by curriculum order (or fall back to learning path ID)
      const sortedLpIds = [...coursesByLp.keys()].toSorted((a, b) => {
        const orderA = lpCurriculumOrder.get(a) ?? Number.MAX_SAFE_INTEGER;
        const orderB = lpCurriculumOrder.get(b) ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });

      // Build flat course list in correct learning path order with stable indices
      let courseIndex = 0;
      const allCourses: ReturnType<typeof buildCourseEntry>[] = [];

      for (const lpId of sortedLpIds) {
        const lpcList = coursesByLp.get(lpId);
        if (!lpcList) {
          continue;
        }

        for (const lpc of lpcList) {
          courseIndex++;
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
      }

      return allCourses;
    }
  });
};
