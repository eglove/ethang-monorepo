import type { PortableTextBlock } from "@portabletext/types";

import { DateTime } from "effect";

import { NO_DRAFTS, sterettSanityClient } from "../clients/sanity-client.ts";

export type CalendarEventReturn = {
  _id: string;
  _updatedAt: string;
  description: PortableTextBlock;
  endsAt: string;
  startsAt: string;
  title: string;
};

export type NewsAndEvents = (CalendarEventReturn | NewsUpdateReturn)[];

export type NewsUpdateReturn = {
  _id: string;
  _updatedAt: string;
  date: string;
  description: PortableTextBlock;
  title: string;
};

const CHICAGO = "America/Chicago";

const getEpoch = (value: string): number => {
  return DateTime.toEpochMillis(DateTime.unsafeMake(value));
};

export const eventRangeFormat = (start: string, end: string): string => {
  const startDt = DateTime.unsafeMake(start);
  const endDt = DateTime.unsafeMake(end);

  const startZoned = DateTime.format(startDt, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: CHICAGO
  });
  const endZoned = DateTime.format(endDt, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: CHICAGO
  });

  const isSameDay =
    DateTime.formatIsoDate(startDt) === DateTime.formatIsoDate(endDt);

  if (isSameDay) {
    return `${startZoned} – ${DateTime.format(endDt, { timeStyle: "short", timeZone: CHICAGO })}`;
  }

  return `${startZoned} – ${endZoned}`;
};

export const getRelativeDate = (date: string): string => {
  const diffMs =
    DateTime.toEpochMillis(DateTime.unsafeMake(date)) -
    DateTime.toEpochMillis(DateTime.unsafeNow());
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (1 > Math.abs(diffDays)) return "Today";

  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  if (7 > Math.abs(diffDays)) return rtf.format(diffDays, "day");
  if (30 > Math.abs(diffDays))
    return rtf.format(Math.round(diffDays / 7), "week");
  return rtf.format(Math.round(diffDays / 30), "month");
};

export const getNewsAndEvents = async (): Promise<NewsAndEvents> => {
  const formattedDate = DateTime.formatIsoDate(DateTime.unsafeNow());

  const eventQuery = `*[_type == "calendarEvent"
    && (startsAt >= "${formattedDate}" || endsAt >= "${formattedDate}")
    && ${NO_DRAFTS}] | order(startsAt asc){_id, _updatedAt, title, startsAt, endsAt, description}`;

  const updateQuery = `*[_type == "newsUpdate"
    && (expireDate != null && expireDate >= "${formattedDate}")
    && ${NO_DRAFTS}] | order(date asc){_id, _updatedAt, title, date, description}`;

  const [events, updates] = await Promise.all([
    sterettSanityClient.fetch<CalendarEventReturn[]>(eventQuery),
    sterettSanityClient.fetch<NewsUpdateReturn[]>(updateQuery)
  ]);

  return [...events, ...updates].toSorted((a, b) => {
    const aString = "startsAt" in a ? a.startsAt : a.date;

    const bString = "startsAt" in b ? b.startsAt : b.date;
    return getEpoch(aString) - getEpoch(bString);
  });
};
