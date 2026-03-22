import type { PortableTextBlock } from "@portabletext/types";

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

export const eventRangeFormat = (start: string, end: string): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const sameDay =
    startDate.toLocaleDateString("en-US", { timeZone: CHICAGO }) ===
    endDate.toLocaleDateString("en-US", { timeZone: CHICAGO });

  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: CHICAGO,
  };

  if (sameDay) {
    return `${startDate.toLocaleString("en-US", dateTimeOptions)} – ${endDate.toLocaleString("en-US", { timeStyle: "short", timeZone: CHICAGO })}`;
  }

  return `${startDate.toLocaleString("en-US", dateTimeOptions)} – ${endDate.toLocaleString("en-US", dateTimeOptions)}`;
};

export const getRelativeDate = (date: string): string => {
  const diffMs = new Date(date).getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

  if (1 > Math.abs(diffDays)) return "Today";
  if (7 > Math.abs(diffDays)) return rtf.format(diffDays, "day");
  if (30 > Math.abs(diffDays))
    return rtf.format(Math.round(diffDays / 7), "week");
  return rtf.format(Math.round(diffDays / 30), "month");
};

export const getNewsAndEvents = async (): Promise<NewsAndEvents> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const formattedDate = today.toISOString().slice(0, 10);

  const eventQuery = `*[_type == "calendarEvent"
    && (startsAt >= "${formattedDate}" || endsAt >= "${formattedDate}")
    && ${NO_DRAFTS}] | order(startsAt asc){_id, _updatedAt, title, startsAt, endsAt, description}`;

  const updateQuery = `*[_type == "newsUpdate"
    && (expireDate != null && expireDate >= "${formattedDate}")
    && ${NO_DRAFTS}] | order(date asc){_id, _updatedAt, title, date, description}`;

  const [events, updates] = await Promise.all([
    sterettSanityClient.fetch<CalendarEventReturn[]>(eventQuery),
    sterettSanityClient.fetch<NewsUpdateReturn[]>(updateQuery),
  ]);

  return [...events, ...updates].toSorted((a, b) => {
    const aDate = new Date("startsAt" in a ? a.startsAt : a.date);
    const bDate = new Date("startsAt" in b ? b.startsAt : b.date);
    return aDate.getTime() - bDate.getTime();
  });
};
