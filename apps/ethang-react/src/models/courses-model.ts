import { queryOptions } from "@tanstack/react-query";

import type { GetCourses } from "./get-courses-types.ts";

import { sanityClient } from "../clients/sanity.ts";

export const getCourses = () => {
  return queryOptions({
    queryFn: async () => {
      return sanityClient.fetch<GetCourses>(`{
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
      }`);
    },
    queryKey: ["getCourses"]
  });
};
