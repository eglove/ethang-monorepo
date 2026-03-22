import { toHTML } from "@portabletext/to-html";
import constant from "lodash/constant.js";
import isArray from "lodash/isArray.js";
import padStart from "lodash/padStart.js";

import type { CalendarEventRecord } from "../sanity/get-calendar-events.ts";

const CHICAGO = "America/Chicago";

export type CalendarCell = {
  current: boolean;
  day: number;
  month: number;
  year: number;
};

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: CHICAGO,
  });

export const toDateKey = (year: number, month: number, day: number) =>
  `${year}-${padStart(String(month), 2, "0")}-${padStart(String(day), 2, "0")}`;

export const buildEventsByDate = (events: CalendarEventRecord[]) => {
  const map = new Map<string, CalendarEventRecord[]>();

  for (const event of events) {
    const cursor = new Date(event.startsAt);
    const end = new Date(event.endsAt);
    cursor.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // eslint-disable-next-line no-unmodified-loop-condition
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(event);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return map;
};

export const buildCalendarWeeks = (
  year: number,
  month: number,
): CalendarCell[][] => {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPreviousMonth = new Date(year, month - 1, 0).getDate();
  const previousMonth = 1 === month ? 12 : month - 1;
  const previousYear = 1 === month ? year - 1 : year;
  const nextMonth = 12 === month ? 1 : month + 1;
  const nextYear = 12 === month ? year + 1 : year;

  const cells: CalendarCell[] = [];

  for (let index = firstDay - 1; 0 <= index; index -= 1) {
    cells.push({
      current: false,
      day: daysInPreviousMonth - index,
      month: previousMonth,
      year: previousYear,
    });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({ current: true, day: d, month, year });
  }
  const remainder = cells.length % 7;
  if (0 < remainder) {
    for (let d = 1; d <= 7 - remainder; d += 1) {
      cells.push({ current: false, day: d, month: nextMonth, year: nextYear });
    }
  }

  const weeks: CalendarCell[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
};

export const renderDescriptionHtml = (
  description: CalendarEventRecord["description"],
): string => {
  if (!description) return "";
  const blocks = isArray(description) ? description : [description];
  return toHTML(blocks, { components: { types: { image: constant("") } } });
};

export const toPlainText = (
  description: CalendarEventRecord["description"],
): string => {
  if (!description) return "";
  const blocks = isArray(description) ? description : [description];
  return blocks
    .filter((b) => "block" === b._type)
    .map((b) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      ((b as { children?: { text?: string }[] }).children ?? [])
        .map((s) => s.text ?? "")
        .join(""),
    )
    .join("\n");
};
