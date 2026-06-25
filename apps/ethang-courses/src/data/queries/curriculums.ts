import { asc, eq, inArray } from "drizzle-orm";
import { Effect } from "effect";
import filter from "lodash/filter.js";
import isError from "lodash/isError.js";
import map from "lodash/map.js";

import type { Database } from "../types.ts";

import {
  coursesTable,
  curriculumLearningPathsTable,
  curriculumsTable,
  learningPathCoursesTable,
  learningPathsTable
} from "../../db/schema.ts";

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

const populateLpWithCourses = async (
  database: Database,
  lpRecord: typeof learningPathsTable.$inferSelect
) => {
  const coursesInPath = await database
    .select()
    .from(learningPathCoursesTable)
    .where(eq(learningPathCoursesTable.learningPathId, lpRecord.id))
    .orderBy(asc(learningPathCoursesTable.orderRank));

  const courseIds = map(coursesInPath, (lpc) => {
    return lpc.courseId;
  });

  const courseRecords: (typeof coursesTable.$inferSelect)[] =
    0 < courseIds.length
      ? await database
          .select()
          .from(coursesTable)
          .where(inArray(coursesTable.id, courseIds))
      : [];

  const courseMap = new Map(
    map(courseRecords, (course) => {
      return [course.id, course] as const;
    })
  );

  return {
    ...lpRecord,
    courses: buildOrderedCourses(coursesInPath, courseMap),
    url: lpRecord.url ?? null
  };
};

const populateCurriculumLps = async (
  database: Database,
  curriculumId: string
) => {
  const curriculumLearningPaths = await database
    .select()
    .from(curriculumLearningPathsTable)
    .where(eq(curriculumLearningPathsTable.curriculumId, curriculumId))
    .orderBy(asc(curriculumLearningPathsTable.orderRank));

  const learningPathIds = map(curriculumLearningPaths, (clp) => {
    return clp.learningPathId;
  });

  if (0 === learningPathIds.length) {
    return [];
  }

  const lpRecords = await database
    .select()
    .from(learningPathsTable)
    .where(inArray(learningPathsTable.id, learningPathIds));

  const lpMap = new Map(
    map(lpRecords, (lp) => {
      return [lp.id, lp] as const;
    })
  );

  const populatedPaths = await Promise.all(
    map(curriculumLearningPaths, async (clp) => {
      const lpRecord = lpMap.get(clp.learningPathId);

      if (!lpRecord) {
        return null;
      }

      return populateLpWithCourses(database, lpRecord);
    })
  );

  return filter(populatedPaths, (path): path is NonNullable<typeof path> => {
    return Boolean(path);
  });
};

export const curriculumsQuery = (database: Database, _parameters: null) => {
  return Effect.tryPromise({
    catch: (cause) => {
      return isError(cause) ? cause : new Error(String(cause));
    },
    try: async () => {
      const curriculums = await database.select().from(curriculumsTable);
      return Promise.all(
        map(curriculums, async (curriculum) => {
          const learningPaths = await populateCurriculumLps(
            database,
            curriculum.id
          );

          return {
            ...curriculum,
            id: curriculum.id,
            learningPaths,
            url: curriculum.url ?? null
          };
        })
      );
    }
  });
};

export const curriculumQuery = (database: Database, curriculumId: string) => {
  return Effect.tryPromise({
    catch: (cause) => {
      return isError(cause) ? cause : new Error(String(cause));
    },
    try: async () => {
      const [curriculumRecord] = await database
        .select()
        .from(curriculumsTable)
        .where(eq(curriculumsTable.id, curriculumId))
        .limit(1);

      if (!curriculumRecord) {
        return null;
      }

      const learningPaths = await populateCurriculumLps(
        database,
        curriculumRecord.id
      );

      return {
        ...curriculumRecord,
        id: curriculumRecord.id,
        learningPaths,
        url: curriculumRecord.url ?? null
      };
    }
  });
};
