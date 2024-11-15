import { queryOptions } from "@tanstack/react-query";

import { NO_DRAFTS, sanityClient } from "../clients/sanity";
import { queryKeys } from "./query-keys";

export type LearningProfile = {
  _createdAt: string;
  _id: string;
  _rev: string;
  _type: string;
  _updatedAt: string;
  name: string;
  url: string;
};

export const learningProfilesQuery = () => {
  return queryOptions<LearningProfile[]>({
    async queryFn() {
      return sanityClient.fetch(`*[_type == "learningProfile" && ${NO_DRAFTS}] | order(name asc)`);
    },
    queryKey: [...queryKeys.learningProfiles(), NO_DRAFTS],
  });
};
