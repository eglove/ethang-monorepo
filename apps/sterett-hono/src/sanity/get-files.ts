import filter from "lodash/filter.js";
import matches from "lodash/matches.js";

import { NO_DRAFTS, sterettSanityClient } from "../clients/sanity-client.ts";

export type FileRecord = {
  _id: string;
  _updatedAt: string;
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

export const getFiles = async () => {
  const generalCovenantQuery = `*[_type == "documentUpload" && (category == "General" || category == "Covenant") && ${NO_DRAFTS}] | order(date desc){_id, _updatedAt, title, category, date, file{asset->{url}}}`;
  const meetingMinutesQuery = `*[_type == "documentUpload" && category == "Meeting Minute" && ${NO_DRAFTS}] | order(date desc){_id, _updatedAt, title, category, date, file{asset->{url}}}`;

  const [generalCovenant, meetingMinutes] = await Promise.all([
    sterettSanityClient.fetch<FileRecord[]>(generalCovenantQuery),
    sterettSanityClient.fetch<FileRecord[]>(meetingMinutesQuery)
  ]);

  const result: FilesResult = {
    covenants: filter(generalCovenant, matches({ category: "Covenant" })),
    general: filter(generalCovenant, matches({ category: "General" })),
    meetingMinutes
  };
  return result;
};
