import type { PortableTextBlock } from "@portabletext/types";

import { NO_DRAFTS, sterettSanityClient } from "../clients/sanity-client.ts";

export type CalendarEventRecord = {
  _id: string;
  _updatedAt: string;
  description?: PortableTextBlock | PortableTextBlock[];
  endsAt: string;
  startsAt: string;
  title: string;
};

export const getLatestCalendarEventUpdatedAt = async () => {
  const query = `*[_type == "calendarEvent" && ${NO_DRAFTS}] | order(_updatedAt desc) [0]._updatedAt`;
  return sterettSanityClient.fetch<string | undefined>(query);
};

export const getCalendarEvents = async (
  rangeStart: string,
  rangeEndExclusive: string,
): Promise<CalendarEventRecord[]> => {
  const query = `*[_type == "calendarEvent" && ${NO_DRAFTS} && startsAt < $rangeEndExclusive && endsAt >= $rangeStart]{_id, _updatedAt, title, startsAt, endsAt, description}`;
  return sterettSanityClient.fetch<CalendarEventRecord[]>(query, {
    rangeEndExclusive,
    rangeStart,
  });
};
