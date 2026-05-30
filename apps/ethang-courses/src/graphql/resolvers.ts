import type { DrizzleD1Database } from "drizzle-orm/d1";

import { eq } from "drizzle-orm";

import { sanityClient } from "../clients/sanity.ts";
import { courseTrackingTable } from "../db/schema.ts";

type Database = DrizzleD1Database<{
  courseTrackingTable: typeof courseTrackingTable;
}>;

const COURSE_TRACKING_STATUS = {
  COMPLETE: "Complete",
  INCOMPLETE: "Incomplete",
  REVISIT: "Revisit"
} as const;

const getCourseUrlByCourseId = async (courseId: string) => {
  const course = await sanityClient.fetch<{ url: string } | null>(
    `*[_type == "course" && _id == $courseId][0]{"url": url}`,
    { courseId }
  );

  if (null === course) {
    throw new Error("Course not found");
  }

  return course.url;
};

const getTrackingByUserIdCourseUrl = async (
  database: Database,
  userId: string,
  courseUrl: string
) => {
  return database.query.courseTrackingTable.findFirst({
    where: (table, operators) => {
      return operators.and(
        operators.eq(table.userId, userId),
        operators.eq(table.courseUrl, courseUrl)
      );
    }
  });
};

const getNextStatus = (status: string) => {
  if (COURSE_TRACKING_STATUS.COMPLETE === status) {
    return COURSE_TRACKING_STATUS.REVISIT;
  }

  if (COURSE_TRACKING_STATUS.REVISIT === status) {
    return COURSE_TRACKING_STATUS.INCOMPLETE;
  }

  return COURSE_TRACKING_STATUS.COMPLETE;
};

export const createResolvers = (database: Database) => {
  return {
    Mutation: {
      cycleCourseTrackingStatus: async (
        _parent: unknown,
        parameters: {
          courseId: string;
          userId: string;
        }
      ) => {
        const courseUrl = await getCourseUrlByCourseId(parameters.courseId);
        const existing = await getTrackingByUserIdCourseUrl(
          database,
          parameters.userId,
          courseUrl
        );

        if (undefined === existing) {
          await database.insert(courseTrackingTable).values({
            courseUrl,
            status: COURSE_TRACKING_STATUS.COMPLETE,
            userId: parameters.userId
          });

          return getTrackingByUserIdCourseUrl(
            database,
            parameters.userId,
            courseUrl
          );
        }

        const nextStatus = getNextStatus(existing.status);

        await database
          .update(courseTrackingTable)
          .set({ status: nextStatus })
          .where(eq(courseTrackingTable.id, existing.id));

        return getTrackingByUserIdCourseUrl(
          database,
          parameters.userId,
          courseUrl
        );
      }
    },
    Query: {
      courseTracking: async (
        _parent: unknown,
        parameters: {
          courseId: string;
          userId: string;
        }
      ) => {
        const courseUrl = await getCourseUrlByCourseId(parameters.courseId);

        return getTrackingByUserIdCourseUrl(
          database,
          parameters.userId,
          courseUrl
        );
      },
      courseTrackings: async (
        _parent: unknown,
        parameters: {
          userId: string;
        }
      ) => {
        return database.query.courseTrackingTable.findMany({
          where: (table, operators) => {
            return operators.eq(table.userId, parameters.userId);
          }
        });
      }
    }
  };
};
