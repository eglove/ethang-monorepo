import { asc, eq, inArray } from "drizzle-orm";
import filter from "lodash/filter.js";
import find from "lodash/find.js";
import map from "lodash/map.js";

import type { DatabaseTransaction } from "../types.ts";

import {
  coursesTable,
  curriculumLearningPathsTable,
  type curriculumsTable,
  learningPathCoursesTable,
  learningPathsTable
} from "../../db/schema.ts";

export const populateLearningPath = async (
  database: DatabaseTransaction,
  lp: typeof learningPathsTable.$inferSelect
) => {
  const courseRelations = await database
    .select({
      courseId: learningPathCoursesTable.courseId
    })
    .from(learningPathCoursesTable)
    .where(eq(learningPathCoursesTable.learningPathId, lp.id))
    .orderBy(asc(learningPathCoursesTable.orderRank));

  const courseIds = map(courseRelations, (relationship) => {
    return relationship.courseId;
  });

  const courses: (typeof coursesTable.$inferSelect)[] =
    0 < courseIds.length
      ? await database
          .select()
          .from(coursesTable)
          .where(inArray(coursesTable.id, courseIds))
      : [];

  const mappedCourses = map(courseIds, (courseId) => {
    return find(courses, (course) => {
      return course.id === courseId;
    });
  });

  const orderedCourses = filter(
    mappedCourses,
    (course): course is typeof coursesTable.$inferSelect => {
      return course !== undefined;
    }
  );

  return {
    ...lp,
    courses: orderedCourses
  };
};

export const populateCurriculum = async (
  database: DatabaseTransaction,
  curriculum: typeof curriculumsTable.$inferSelect
) => {
  const lpRelations = await database
    .select({
      learningPathId: curriculumLearningPathsTable.learningPathId
    })
    .from(curriculumLearningPathsTable)
    .where(eq(curriculumLearningPathsTable.curriculumId, curriculum.id))
    .orderBy(asc(curriculumLearningPathsTable.orderRank));

  const lpIds = map(lpRelations, (relationship) => {
    return relationship.learningPathId;
  });

  const learningPaths: (typeof learningPathsTable.$inferSelect)[] =
    0 < lpIds.length
      ? await database
          .select()
          .from(learningPathsTable)
          .where(inArray(learningPathsTable.id, lpIds))
      : [];

  const mappedLps = map(lpIds, (lpId) => {
    return find(learningPaths, (lp) => {
      return lp.id === lpId;
    });
  });

  const orderedLps = filter(
    mappedLps,
    (lp): lp is typeof learningPathsTable.$inferSelect => {
      return lp !== undefined;
    }
  );

  const populatedLps = await Promise.all(
    map(orderedLps, async (lp) => {
      return populateLearningPath(database, lp);
    })
  );

  return {
    ...curriculum,
    learningPaths: populatedLps
  };
};
