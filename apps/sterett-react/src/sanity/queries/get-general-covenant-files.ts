import { queryOptions } from "@tanstack/react-query";

import type { GetFilesSchema } from "./get-files.ts";

import { queryKeys } from "../../clients/react-query/query-keys.ts";
import {
  NO_DRAFTS,
  sterettSanityClient,
} from "../../clients/sanity/sanity-client.ts";

export const getGeneralCovenantFiles = async () => {
  const filesQuery = `*[_type == "documentUpload" && (category == "General" || category == "Covenant") && ${NO_DRAFTS}] | order(date desc){_id, title, category, date, file{asset->{url}}}`;

  return sterettSanityClient.fetch<GetFilesSchema[]>(filesQuery);
};

export const getGeneralCovenantFilesQueryOptions = () => {
  return queryOptions({
    queryFn: getGeneralCovenantFiles,
    queryKey: [queryKeys.sterett, queryKeys.getGeneralCovenantFiles],
  });
};
