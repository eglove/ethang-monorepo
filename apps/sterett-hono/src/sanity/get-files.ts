import filter from "lodash/filter.js";

import { NO_DRAFTS, sterettSanityClient } from "../clients/sanity-client.ts";

export type FileRecord = {
  _id: string;
  category: string;
  date: string;
  file: { asset: { url: string } };
  title: string;
};

type FilesResult = {
  covenants: FileRecord[];
  general: FileRecord[];
  meetingMinutes: FileRecord[];
};

export const getFiles = async (): Promise<FilesResult> => {
  const generalCovenantQuery = `*[_type == "documentUpload" && (category == "General" || category == "Covenant") && ${NO_DRAFTS}] | order(date desc){_id, title, category, date, file{asset->{url}}}`;
  const meetingMinutesQuery = `*[_type == "documentUpload" && category == "Meeting Minute" && ${NO_DRAFTS}] | order(date desc){_id, title, category, date, file{asset->{url}}}`;

  const [generalCovenant, meetingMinutes] = await Promise.all([
    sterettSanityClient.fetch<FileRecord[]>(generalCovenantQuery),
    sterettSanityClient.fetch<FileRecord[]>(meetingMinutesQuery),
  ]);

  return {
    covenants: filter(generalCovenant, (f) => "Covenant" === f.category),
    general: filter(generalCovenant, (f) => "General" === f.category),
    meetingMinutes,
  };
};
