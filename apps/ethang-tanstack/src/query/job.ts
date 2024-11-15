import type { TypedObject } from "@portabletext/types";

import { queryOptions } from "@tanstack/react-query";

import { NO_DRAFTS, sanityClient } from "../clients/sanity";
import { queryKeys } from "./query-keys";

export type Job = {
  _createdAt: string;
  _id: string;
  _rev: string;
  _type: string;
  _updatedAt: string;
  company: string;
  description: TypedObject | TypedObject[];
  endDate: string | undefined;
  methodologiesUsed: {
    _createdAt: string;
    _id: string;
    _rev: string;
    _type: string;
    _updatedAt: string;
    name: string;
  }[];
  startDate: string;
  techUsed: {
    _createdAt: string;
    _id: string;
    _rev: string;
    _type: string;
    _updatedAt: string;
    name: string;
  }[];
  title: string;
};

export const jobsQuery = () => {
  return queryOptions<Job[]>({
    async queryFn() {
      return sanityClient.fetch(`*[_type == "job" && ${NO_DRAFTS}] | order(startDate desc) {
          ...,
          "techUsed": techUsed[]->,
          "methodologiesUsed": methodologiesUsed[]->,
        }`);
    },
    queryKey: [...queryKeys.jobs(), NO_DRAFTS],
  });
};
