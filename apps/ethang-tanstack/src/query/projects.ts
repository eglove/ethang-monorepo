import type { TypedObject } from "@portabletext/types";

import { queryOptions } from "@tanstack/react-query";

import { NO_DRAFTS, sanityClient } from "../clients/sanity";
import { queryKeys } from "./query-keys";

export type Project = {
  _createdAt: string;
  _id: string;
  _rev: string;
  _type: string;
  _updatedAt: string;
  description: TypedObject | TypedObject[];
  name: string;
  url: string;
};

export const projectsQuery = () => {
  return queryOptions<Project[]>({
    async queryFn() {
      return sanityClient.fetch(`*[_type == "projects" && ${NO_DRAFTS}] | order(name asc)`);
    },
    queryKey: [...queryKeys.projects(), NO_DRAFTS],
  });
};
