import type { PortableTextBlock } from "@portabletext/types";

import { queryOptions } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty.js";
import map from "lodash/map";
import { DateTime } from "luxon";

import { queryKeys } from "../../clients/react-query/query-keys.ts";
import {
  NO_DRAFTS,
  sterettSanityClient,
} from "../../clients/sanity/sanity-client.ts";
import { AMERICA_CHICAGO, getRelativeDate } from "../../utilities/date.ts";

export type CalendarEventReturn = {
  _id: string;
  description: PortableTextBlock;
  endsAt: string;
  relativeStart?: string;
  startsAt: string;
  title: string;
};

export type EventsNewsReturn = {
  events?: CalendarEventReturn[];
  updates?: NewsUpdateReturn[];
};

export type NewsAndEvents = (CalendarEventReturn | NewsUpdateReturn)[];

export type NewsUpdateReturn = {
  _id: string;
  date: string;
  description: PortableTextBlock;
  title: string;
};

export const getNewsAndEvents = async () => {
  const today = DateTime.fromJSDate(new Date(), {
    zone: AMERICA_CHICAGO,
  }).set({
    hour: 0,
    millisecond: 0,
    minute: 0,
    second: 0,
  });
  const formattedDate = today.toFormat("yyyy-LL-dd");

  const eventQuery = ` 
    *[_type == "calendarEvent" 
    && (startsAt >= "${formattedDate}" || endsAt >= "${formattedDate}") 
    && ${NO_DRAFTS}] | order(startsAt asc){_id, title, startsAt, endsAt, description}`;

  const expiresQuery = `(expireDate != null && expireDate >= "${formattedDate}")`;
  const updateQuery = `*[_type == "newsUpdate" && ${expiresQuery} && ${NO_DRAFTS}] | order(date asc){_id, title, date, description}`;

  const [events, updates] = await Promise.all([
    sterettSanityClient.fetch<CalendarEventReturn[]>(eventQuery),
    sterettSanityClient.fetch<NewsUpdateReturn[]>(updateQuery),
  ]);

  const sorted = sortNewsAndEvents({
    events,
    updates,
  });

  return map(sorted, (item) => {
    if ("startsAt" in item) {
      return {
        ...item,
        relativeStart: getRelativeDate(item.startsAt),
      };
    }

    return item;
  });
};

const sortNewsAndEvents = (eventsNews: EventsNewsReturn) => {
  const merged: NewsAndEvents = [];

  if (!isEmpty(eventsNews.events)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    merged.push(eventsNews.events as unknown as NewsAndEvents[0]);
  }

  if (!isEmpty(eventsNews.updates)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    merged.push(eventsNews.updates as unknown as NewsAndEvents[0]);
  }

  return merged.flat().sort((a, b) => {
    const aDate = "startsAt" in a ? new Date(a.startsAt) : new Date(a.date);
    const bDate = "startsAt" in b ? new Date(b.startsAt) : new Date(b.date);

    return aDate.getTime() - bDate.getTime();
  });
};

export const getNewsAndEventsQueryOptions = () => {
  return queryOptions({
    queryFn: getNewsAndEvents,
    queryKey: [queryKeys.sterett, queryKeys.getNewsAndEvents],
  });
};
