import { and, asc, eq, inArray } from "drizzle-orm";
import filter from "lodash/filter.js";
import find from "lodash/find.js";
import map from "lodash/map.js";

import type { Database } from "../types.ts";

import {
  coursesTable,
  learningPathCoursesTable,
  learningPathsTable
} from "../../db/schema.ts";

export const coursesQuery = (database: Database) => {
  return async () => {
    return database.select().from(coursesTable);
  };
};

export const courseQuery = (database: Database) => {
  return async (_parent: unknown, parameters: { id: string }) => {
    const result = await database
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, parameters.id))
      .limit(1);

    return result[0] ?? null;
  };
};

const findCourseById = (
  courses: (typeof coursesTable.$inferSelect)[],
  courseId: string
) => {
  return find(courses, (course) => {
    return course.id === courseId;
  });
};

export const learningPathsQuery = (database: Database) => {
  return async () => {
    // First get all learning paths
    const learningPaths = await database.select().from(learningPathsTable);

    // For each learning path, get its ordered courses
    return Promise.all(
      map(learningPaths, async (lp) => {
        // Get courses for this learning path ordered by rank
        const courseRelations = await database
          .select({
            courseId: learningPathCoursesTable.courseId
          })
          .from(learningPathCoursesTable)
          .where(eq(learningPathCoursesTable.learningPathId, lp.id))
          .orderBy(asc(learningPathCoursesTable.orderRank));

        // Get detailed course information for each course ID
        const courseIds = map(courseRelations, (relationship) => {
          return relationship.courseId;
        });

        let courses: (typeof coursesTable.$inferSelect)[] = [];
        if (0 < courseIds.length) {
          courses = await database
            .select()
            .from(coursesTable)
            .where(inArray(coursesTable.id, courseIds));
        }

        // Sort courses according to the orderRank in the relation
        const mappedCourses = map(courseIds, (courseId) => {
          return findCourseById(courses, courseId);
        });

        const orderedCourses = filter(mappedCourses, Boolean);

        return {
          ...lp,
          courses: orderedCourses
        };
      })
    );
  };
};

export const learningPathQuery = (database: Database) => {
  return async (_parent: unknown, parameters: { id: string }) => {
    // Get the learning path
    const [learningPath] = await database
      .select()
      .from(learningPathsTable)
      .where(eq(learningPathsTable.id, parameters.id))
      .limit(1);

    if (!learningPath) {
      return null;
    }

    // Get courses for this learning path ordered by rank
    const courseRelations = await database
      .select({
        courseId: learningPathCoursesTable.courseId
      })
      .from(learningPathCoursesTable)
      .where(and(eq(learningPathCoursesTable.learningPathId, learningPath.id)))
      .orderBy(asc(learningPathCoursesTable.orderRank));

    // Get detailed course information for each course ID
    const courseIds = map(courseRelations, (relationship) => {
      return relationship.courseId;
    });

    let courses: (typeof coursesTable.$inferSelect)[] = [];
    if (0 < courseIds.length) {
      courses = await database
        .select()
        .from(coursesTable)
        .where(inArray(coursesTable.id, courseIds));
    }

    // Sort courses according to the orderRank in the relation
    const mappedCourses = map(courseIds, (courseId) => {
      return findCourseById(courses, courseId);
    });

    const orderedCourses = filter(mappedCourses, Boolean);

    return {
      ...learningPath,
      courses: orderedCourses
    };
  };
};
