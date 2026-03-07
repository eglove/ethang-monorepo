import type { Context, Input } from "hono";

import find from "lodash/find.js";
import flatMap from "lodash/flatMap.js";

import { sanityClient } from "../clients/sanity.ts";
import { getDatabase } from "../db/database.ts";
import { CourseTracking } from "../models/course-tracking.ts";
import { type AppContext, globalStore } from "./global-store-properties.ts";

export type CoursePathDataProperties = {
  latestUpdate: {
    _id: string;
    _updatedAt: string;
  };
  learningPaths: {
    _id: string;
    courseCount: number;
    courses: {
      _id: string;
      author: string;
      name: string;
      url: string;
    }[];
    name: string;
    swebokFocus: string;
    url?: string;
  }[];
  totalCourseCount: number;
};

export class CoursePathStore {
  public courseTrackings: Awaited<
    ReturnType<CourseTracking["getCourseTrackingByUserId"]>
  > = [];
  public latestUpdate: CoursePathDataProperties["latestUpdate"] | undefined;
  public learningPaths: CoursePathDataProperties["learningPaths"] | undefined;
  public totalCourseCount: number | undefined;

  public getCourse(courseId: string) {
    return find(
      flatMap(this.learningPaths, (_path) => _path.courses),
      ["_id", courseId],
    );
  }

  public getCourseTracking(courseId: string) {
    return find(this.courseTrackings, ["courseId", courseId]);
  }

  public getLearningPathCourses(pathId: string) {
    return find(this.learningPaths, ["_id", pathId])?.courses;
  }

  public setup = async <P extends string, I extends Input>(
    context: Context<AppContext, P, I>,
  ) => {
    const database = getDatabase(context);
    const courseTracking = new CourseTracking(database);
    const userId = globalStore.userId ?? "";

    const [courseTrackings, sanityData] = await Promise.all([
      courseTracking.getCourseTrackingByUserId(userId),
      sanityClient.fetch<CoursePathDataProperties>(
        `{
        "latestUpdate": *[_type in ["course", "learningPath"]] | order(_updatedAt desc)[0] {
          _id,
          _updatedAt
        },
      
        "learningPaths": *[_type == "learningPath"] | order(orderRank) {
          _id,
          name,
          url,
          swebokFocus,
          "courseCount": count(courses),
          "courses": courses[]->{
            _id,
            name,
            url,
            author
          }
        }
      }`,
      ),
    ]);

    let totalCourseCount = 0;

    for (const learningPath of sanityData.learningPaths) {
      totalCourseCount += learningPath.courseCount;
    }

    this.courseTrackings = courseTrackings;
    this.latestUpdate = sanityData.latestUpdate;
    this.totalCourseCount = totalCourseCount;
    this.learningPaths = sanityData.learningPaths;
  };
}

// @ts-expect-error it isn't
export const coursePathData = new CoursePathStore();
