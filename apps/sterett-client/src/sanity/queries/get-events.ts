import type { PortableTextBlock } from "@portabletext/types";

import { queryOptions } from "@tanstack/react-query";
import { DateTime } from "luxon";

import { queryKeys } from "../../clients/react-query/query-keys.ts";
import {
  NO_DRAFTS,
  sterettSanityClient,
} from "../../clients/sanity/sanity-client.ts";
import { AMERICA_CHICAGO } from "../../utilities/date.ts";

export type CalendarEventSchema = {
  _id: string;
  description: PortableTextBlock;
  endsAt: string;
  startsAt: string;
  title: string;
}[];

export const getEvents = async () => {
  const today = DateTime.fromJSDate(new Date(), {
    zone: AMERICA_CHICAGO,
  }).set({
    hour: 0,
    millisecond: 0,
    minute: 0,
    second: 0,
  });
  const formattedDate = today.toFormat("yyyy-LL-dd");
  const oneMonth = today.plus({ month: 1 }).toFormat("yyyy-LL-dd");

  const eventQuery = `
    *[_type == "calendarEvent" 
    && (startsAt >= "${formattedDate}" && endsAt <= "${oneMonth}") 
    && ${NO_DRAFTS}] | order(startsAt asc){_id, title, startsAt, endsAt, description}`;

  return sterettSanityClient.fetch<CalendarEventSchema>(eventQuery);
};

export const getEventsQueryOptions = () => {
  return queryOptions({
    queryFn: getEvents,
    queryKey: [queryKeys.sterett, queryKeys.getEvents],
  });
};
