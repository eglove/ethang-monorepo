import { toHTML } from "@portabletext/to-html";
import constant from "lodash/constant.js";
import filter from "lodash/filter.js";
import isArray from "lodash/isArray.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import padStart from "lodash/padStart.js";
import { DateTime } from "luxon";

import type { CalendarEventRecord } from "../sanity/get-calendar-events.ts";

const CHICAGO = "America/Chicago";
const LOCALE = "en-US";

export type CalendarCell = {
  current: boolean;
  day: number;
  month: number;
  year: number;
};

export const formatDateTime = (iso: string) =>
  DateTime.fromISO(iso)
    .setZone(CHICAGO)
    .toLocaleString(
      { dateStyle: "medium", timeStyle: "short" },
      { locale: LOCALE },
    );

export const toDateKey = (year: number, month: number, day: number) =>
  `${year}-${padStart(String(month), 2, "0")}-${padStart(String(day), 2, "0")}`;

const addToDateMap = (
  dateMap: Map<string, CalendarEventRecord[]>,
  key: string,
  event: CalendarEventRecord,
) => {
  if (!dateMap.has(key)) dateMap.set(key, []);
  dateMap.get(key)?.push(event);
};

export const buildEventsByDate = (events: CalendarEventRecord[]) => {
  const dateMap = new Map<string, CalendarEventRecord[]>();

  for (const event of events) {
    let cursor = DateTime.fromISO(event.startsAt)
      .setZone(CHICAGO)
      .startOf("day");
    const end = DateTime.fromISO(event.endsAt).setZone(CHICAGO).startOf("day");

    while (cursor.toMillis() <= end.toMillis()) {
      const key = cursor.toISODate();
      cursor = cursor.plus({ days: 1 });
      if (!isNil(key)) addToDateMap(dateMap, key, event);
    }
  }

  return dateMap;
};

export const buildCalendarWeeks = (
  year: number,
  month: number,
): CalendarCell[][] => {
  const firstDayDt = DateTime.fromObject(
    { day: 1, month, year },
    { zone: CHICAGO },
  );
  const firstDay = firstDayDt.weekday % 7; // 0=Sun, 1=Mon, …, 6=Sat
  const { daysInMonth } = firstDayDt;
  const previousMonthDt = firstDayDt.minus({ months: 1 });
  const daysInPreviousMonth = previousMonthDt.daysInMonth;

  if (isNil(daysInMonth) || isNil(daysInPreviousMonth)) return [];

  const nextMonthDt = firstDayDt.plus({ months: 1 });
  const previousMonth = previousMonthDt.month;
  const previousYear = previousMonthDt.year;
  const nextMonth = nextMonthDt.month;
  const nextYear = nextMonthDt.year;

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

export const getViewDateRange = (
  view: "day" | "month" | "week",
  year: number,
  month: number,
  date: string,
): { rangeEndExclusive: string; rangeStart: string } => {
  if ("day" === view) {
    return { rangeEndExclusive: shiftDate(date, 1), rangeStart: date };
  }
  if ("week" === view) {
    const weekDays = getWeekDays(date);
    const { 0: firstDay, 6: lastDay } = weekDays;
    return {
      rangeEndExclusive: shiftDate(isNil(lastDay) ? date : lastDay, 1),
      rangeStart: isNil(firstDay) ? date : firstDay,
    };
  }
  // Month view: use the full visible grid including leading/trailing days from adjacent months.
  // Grid start = Sunday on or before the 1st; grid end = Saturday on or after the last day.
  const firstDayDt = DateTime.fromObject(
    { day: 1, month, year },
    { zone: CHICAGO },
  );
  const lastDayDt = firstDayDt.endOf("month").startOf("day");
  const gridStartDt = firstDayDt.minus({ days: firstDayDt.weekday % 7 });
  const gridEndExclusiveDt = lastDayDt.plus({
    days: 7 - (lastDayDt.weekday % 7),
  });
  return {
    rangeEndExclusive: gridEndExclusiveDt.toISODate() ?? shiftDate(date, 42),
    rangeStart: gridStartDt.toISODate() ?? date,
  };
};

export const renderDescriptionHtml = (
  description: CalendarEventRecord["description"],
): string => {
  if (!description) return "";
  const blocks = isArray(description) ? description : [description];
  return toHTML(blocks, { components: { types: { image: constant("") } } });
};

export const shiftDate = (dateString: string, days: number): string => {
  const result = DateTime.fromISO(dateString, { zone: CHICAGO })
    .plus({ days })
    .toISODate();
  return isNil(result) ? dateString : result;
};

export const getWeekDays = (dateString: string): string[] => {
  const anchor = DateTime.fromISO(dateString, { zone: CHICAGO });
  const sunday = anchor.minus({ days: anchor.weekday % 7 });
  return Array.from({ length: 7 }, (_, index) => {
    const date = sunday.plus({ days: index }).toISODate();
    return isNil(date) ? "" : date;
  });
};

export const formatTimeOnly = (iso: string): string =>
  DateTime.fromISO(iso)
    .setZone(CHICAGO)
    .toLocaleString({ hour: "numeric", minute: "2-digit" }, { locale: LOCALE });

export const formatDayHeading = (dateString: string): string =>
  DateTime.fromISO(dateString, { zone: CHICAGO }).toLocaleString(
    { day: "numeric", month: "long", weekday: "long", year: "numeric" },
    { locale: LOCALE },
  );

export const formatWeekHeading = (dateString: string): string => {
  const days = getWeekDays(dateString);
  const { 0: firstDay, 6: lastDay } = days;
  if (isNil(firstDay) || isNil(lastDay)) return "";
  const start = DateTime.fromISO(firstDay, { zone: CHICAGO }).toLocaleString(
    { day: "numeric", month: "short" },
    { locale: LOCALE },
  );
  const end = DateTime.fromISO(lastDay, { zone: CHICAGO }).toLocaleString(
    { day: "numeric", month: "short", year: "numeric" },
    { locale: LOCALE },
  );
  return `${start} – ${end}`;
};

export const toPlainText = (
  description: CalendarEventRecord["description"],
): string => {
  if (!description) return "";
  const blocks = isArray(description) ? description : [description];
  return map(
    filter(blocks, (b) => "block" === b._type),
    (b) =>
      map(b.children, (child) =>
        "text" in child && isString(child.text) ? child.text : "",
      ).join(""),
  ).join("\n");
};
