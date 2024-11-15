import type { TypedObject } from "@portabletext/types";

import { queryOptions } from "@tanstack/react-query";

import { NO_DRAFTS, sanityClient } from "../clients/sanity";
import { queryKeys } from "./query-keys";

export type Certification = {
  _createdAt: string;
  _id: string;
  _rev: string;
  _type: string;
  _updatedAt: string;
  description: TypedObject | TypedObject[];
  issuedBy: string;
  issuedOn: string;
  name: string;
  url: string;
};

export const certificationsQuery = () => {
  return queryOptions<Certification[]>({
    async queryFn() {
      return sanityClient.fetch(`*[_type == "certification" && ${NO_DRAFTS}] | order(issuedOn asc)`);
    },
    queryKey: [...queryKeys.certifications(), NO_DRAFTS],
  });
};
