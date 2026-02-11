import type { TypedObject } from "@portabletext/types";

import { queryOptions } from "@tanstack/react-query";

import { sanityClient } from "./sanity-client.ts";

type GetPaths = {
  _id: string;
  courseCount: number;
  name: string;
  swebokFocus: string;
  url: string;
};

export const getPaths = () => {
  return queryOptions({
    queryFn: async () => {
      return sanityClient.fetch<
        GetPaths[]
      >(`*[_type == "learningPath"] | order(orderRank) {
  _id,
  name,
  url,
  swebokFocus,
  "courseCount": count(courses),
}`);
    },
    queryKey: ["paths"],
  });
};

export const getCourseIds = (pathId: string) => {
  return queryOptions({
    queryFn: async () => {
      return sanityClient.fetch<{ _id: string }[]>(
        `*[_type == "learningPath" && _id == $pathId][0].courses[]{
          "_id": _ref
        }`,
        { pathId },
      );
    },
    queryKey: ["courses", pathId],
  });
};

export const getCourseCount = () => {
  return queryOptions({
    queryFn: async () => {
      const counts = await sanityClient.fetch<{ courseCount: number }[]>(
        `*[_type == "learningPath"] {
          "courseCount": count(courses)
        }`,
      );

      let total = 0;

      for (const count of counts) {
        total += count.courseCount;
      }

      return total;
    },
    queryKey: ["courseCount"],
  });
};

type GetCourse = {
  _id: string;
  author: string;
  name: string;
  url: string;
};

export const getCourse = (courseId: string) => {
  return queryOptions({
    queryFn: async () => {
      return sanityClient.fetch<GetCourse>(
        `*[_type == "course" && _id == $courseId][0]{
        _id,
        url,
        name,
        author
      }`,
        {
          courseId,
        },
      );
    },
    queryKey: ["course", courseId],
  });
};

export const getProjectIds = () => {
  return queryOptions({
    queryFn: async () => {
      return sanityClient.fetch<{ _id: string }[]>(`*[
        _type == "project"
      ]{
        "_id": _id
      }`);
    },
    queryKey: ["projects"],
  });
};

type GetProject = {
  _id: string;
  description: TypedObject | TypedObject[];
  githubUrl: string;
  publicUrl: string;
  techs: { _id: string; name: string }[];
  title: string;
};

export const getProject = (projectId: string) => {
  return queryOptions({
    queryFn: async () => {
      return sanityClient.fetch<GetProject>(
        `*[_type == "project" && _id == $projectId][0] {
  _id,
  title,
  publicUrl,
  githubUrl,
  "techs": techs[]-> {
    _id,
    name,
  },
  description
}`,
        { projectId },
      );
    },
    queryKey: ["project", projectId],
  });
};

export const getTopProjectIds = () => {
  return queryOptions({
    queryFn: async () => {
      return sanityClient.fetch<
        { _id: string }[]
      >(`*[_type == "project" && title in ["@ethang/store", "@ethang/eslint-config", "@ethang/toolbelt"]] {
  _id
}`);
    },
    queryKey: [
      "project",
      "@ethang/store",
      "@ethang/eslint-config",
      "@ethang/toolbelt",
    ],
  });
};

export const getLatestUpdate = () => {
  return queryOptions({
    queryFn: async () => {
      return sanityClient.fetch<{ _id: string; _updatedAt: string }>(
        `*[_type in ["course", "learningPath"]] | order(_updatedAt desc)[0] {
          _id,
          _updatedAt
        }`,
      );
    },
    queryKey: ["latestUpdate"],
  });
};

type WowTask = {
  _id: string;
  notes: string;
  objective: string;
  requirements: WowTask[];
  taskType: string;
  title: string;
};

export const getWowTasks = () => {
  return queryOptions({
    queryFn: async () => {
      return sanityClient.fetch<
        WowTask[]
      >(`*[_type == "wowTask"] | order(orderRank asc) {
  _id,
  notes,
  objective,
  taskType,
  title
}`);
    },
    queryKey: ["wowTasks"],
  });
};
