import type { TypedObject } from "@portabletext/types";

import { queryOptions } from "@tanstack/react-query";

import { NO_DRAFTS, sanityClient } from "../clients/sanity";
import { queryKeys } from "./query-keys";

const query = `*[_type == "courseList" && title == "Recommended Courses" && ${NO_DRAFTS}]{
  ...,
  courseSections[]->{
    ...,
    courses[]->{
      ...
    }
  }
}`;

export const recommendedCoursesQuery = () => {
  return queryOptions<CourseList | undefined>({
    async queryFn() {
      const results: CourseList[] = await sanityClient.fetch(query);

      return results[0];
    },
    queryKey: queryKeys.recommendedCourses(),
  });
};

export type CourseList = {
  _createdAt: string;
  _id: string;
  _rev: string;
  _type: string;
  _updatedAt: string;
  courseSections: CourseSection[];
  description: TypedObject | TypedObject[];
  title: string;
};

type CourseSection = {
  _createdAt: string;
  _id: string;
  _rev: string;
  _type: string;
  _updatedAt: string;
  courses: Course[];
  description: TypedObject | TypedObject[];
  title: string;
};

export type Course = {
  _createdAt: string;
  _id: string;
  _rev: string;
  _type: string;
  _updatedAt: string;
  name: string;
  url: string;
};
