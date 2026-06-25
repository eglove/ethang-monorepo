import { asc, eq, inArray } from "drizzle-orm";
import { Effect } from "effect";
import filter from "lodash/filter.js";
import isError from "lodash/isError.js";
import map from "lodash/map.js";

import type { Database } from "../types.ts";

import {
  coursesTable,
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

  const courseIds = map(coursesInPath, (lpc) => {
    return lpc.courseId;
  });

  if (0 === courseIds.length) {
    return { orderedCourses: [] };
  }

  const courseRecords = await database
    .select()
    .from(coursesTable)
    .where(inArray(coursesTable.id, courseIds));

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
