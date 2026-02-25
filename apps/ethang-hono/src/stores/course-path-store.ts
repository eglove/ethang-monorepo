import find from "lodash/find.js";
import flatMap from "lodash/flatMap.js";

import { sanityClient } from "../clients/sanity.ts";

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
  public latestUpdate: CoursePathDataProperties["latestUpdate"] | undefined;
  public learningPaths: CoursePathDataProperties["learningPaths"] | undefined;
  public totalCourseCount: number | undefined;

  public getCourse(courseId: string) {
    return find(
      flatMap(this.learningPaths, (_path) => _path.courses),
      ["_id", courseId],
    );
  }

  public getLearningPathCourses(pathId: string) {
    return find(this.learningPaths, ["_id", pathId])?.courses;
  }

  public setup = async () => {
    const resolved = await sanityClient.fetch<CoursePathDataProperties>(
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
    );

    let totalCourseCount = 0;

    for (const learningPath of resolved.learningPaths) {
      totalCourseCount += learningPath.courseCount;
    }

    this.latestUpdate = resolved.latestUpdate;
    this.totalCourseCount = totalCourseCount;
    this.learningPaths = resolved.learningPaths;
  };
}

export const coursePathData = new CoursePathStore();
