import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { queryKeys } from "../../clients/react-query/query-keys.ts";
import {
  NO_DRAFTS,
  sterettSanityClient,
} from "../../clients/sanity/sanity-client.ts";

export type GetAllPagesReturn = {
  _id: string;
  slug: {
    current: string;
  };
  title: string;
}[];

export const getAllPagesSchema = z.array(
  z.object({
    _id: z.string(),
    slug: z.object({
      current: z.string(),
    }),
    title: z.string(),
  }),
);

export const getAllPages = async () => {
  const slugQuery = `*[_type == "page" && slug.current != "home" && ${NO_DRAFTS}]{_id, title, slug{current}}`;

  return sterettSanityClient.fetch<GetAllPagesReturn>(slugQuery);
};

export const getAllPagesQueryOptions = () => {
  return queryOptions({
    queryFn: getAllPages,
    queryKey: [queryKeys.sterett, queryKeys.getAllPages],
  });
};
