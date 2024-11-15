import type { TypedObject } from "@portabletext/types";

import { queryOptions } from "@tanstack/react-query";

import { NO_DRAFTS, sanityClient } from "../clients/sanity";
import { queryKeys } from "./query-keys";

export const courseSectionByTitleQuery = () => {
  return queryOptions<CourseSection>({
    queryFn: async () => {
      const result: CourseSection[] = await sanityClient.fetch(`*[_type == "courseSection" && ${NO_DRAFTS}]{
  ...,
  courses[]->{
    ...
  }
}`);

      return result[0];
    },
    queryKey: queryKeys.courseSection(),
  });
};

type CourseSection = {
  _createdAt: string;
  _id: string;
  _rev: string;
  _type: string;
  _updatedAt: string;
  courses: {
    _createdAt: string;
    _id: string;
    _rev: string;
    _type: string;
    _updatedAt: string;
    name: string;
    url: string;
  }[];
  description: TypedObject | TypedObject[];
  title: string;
};
