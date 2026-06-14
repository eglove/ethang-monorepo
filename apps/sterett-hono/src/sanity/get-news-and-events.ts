import type { PortableTextBlock } from "@portabletext/types";

import includes from "lodash/includes.js";
import { DateTime, type DateTimeFormatOptions } from "luxon";

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
  const hasTime = includes(value, "T");
  return (
    hasTime ? DateTime.fromISO(value) : DateTime.fromISO(value).setZone("UTC")
  ).toMillis();
};

export const eventRangeFormat = (start: string, end: string): string => {
  const startZoned = DateTime.fromISO(start).setZone(CHICAGO);
  const endZoned = DateTime.fromISO(end).setZone(CHICAGO);

  const sameDay = startZoned.hasSame(endZoned, "day");

  const dateTimeOptions: DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short"
  };

  if (sameDay) {
    return `${startZoned.toLocaleString(dateTimeOptions)} – ${endZoned.toLocaleString({ timeStyle: "short" })}`;
  }

  return `${startZoned.toLocaleString(dateTimeOptions)} – ${endZoned.toLocaleString(dateTimeOptions)}`;
};

export const getRelativeDate = (date: string): string => {
  const diffMs = DateTime.fromISO(date).toMillis() - DateTime.now().toMillis();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (1 > Math.abs(diffDays)) return "Today";

  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  if (7 > Math.abs(diffDays)) return rtf.format(diffDays, "day");
  if (30 > Math.abs(diffDays))
    return rtf.format(Math.round(diffDays / 7), "week");
  return rtf.format(Math.round(diffDays / 30), "month");
};

export const getNewsAndEvents = async (): Promise<NewsAndEvents> => {
  const formattedDate = DateTime.now().toISODate();

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
    // eslint-disable-next-line unicorn/prefer-minimal-ternary
    const aString = "startsAt" in a ? a.startsAt : a.date;
    // eslint-disable-next-line unicorn/prefer-minimal-ternary
    const bString = "startsAt" in b ? b.startsAt : b.date;
    return getEpoch(aString) - getEpoch(bString);
  });
};
