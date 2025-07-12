import { queryOptions } from "@tanstack/react-query";

import { queryKeys } from "../../clients/react-query/query-keys.ts";
import {
  NO_DRAFTS,
  sterettSanityClient,
} from "../../clients/sanity/sanity-client.ts";

export type GetFilesSchema = {
  _id: string;
  category: string;
  date: string;
  file: {
    asset: {
      url: string;
    };
  };
  title: string;
};

export const getFiles = async () => {
  const generalQuery = `*[_type == "documentUpload" && category == "General" && ${NO_DRAFTS}] | order(date desc){_id, title, file{asset->{url}}}`;
  const covenantsQuery = `*[_type == "documentUpload" && category == "Covenant" && ${NO_DRAFTS}] | order(date desc){_id, title, file{asset->{url}}}`;
  const meetingMinutesQuery = `*[_type == "documentUpload" && category == "Meeting Minute" && ${NO_DRAFTS}] | order(date desc){_id, title, file{asset->{url}}}`;

  const data = await Promise.all([
    sterettSanityClient.fetch<GetFilesSchema[]>(generalQuery),
    sterettSanityClient.fetch<GetFilesSchema[]>(covenantsQuery),
    sterettSanityClient.fetch<GetFilesSchema[]>(meetingMinutesQuery),
  ]);

  return {
    covenants: data[1],
    general: data[0],
    meetingMinutes: data[2],
  };
};

export const getFilesQueryOptions = () => {
  return queryOptions({
    queryFn: getFiles,
    queryKey: [queryKeys.sterett, queryKeys.getFiles],
  });
};
