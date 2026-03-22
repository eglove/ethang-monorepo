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

export const getCalendarEvents = async (): Promise<CalendarEventRecord[]> => {
  const query = `*[_type == "calendarEvent" && ${NO_DRAFTS}]{_id, _updatedAt, title, startsAt, endsAt, description}`;
  return sterettSanityClient.fetch<CalendarEventRecord[]>(query);
};
