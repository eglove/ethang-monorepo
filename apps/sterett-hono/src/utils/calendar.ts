import { toHTML } from "@portabletext/to-html";
import { DateTime, Option } from "effect";
import constant from "lodash/constant.js";
import filter from "lodash/filter.js";
import isArray from "lodash/isArray.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import padStart from "lodash/padStart.js";
import split from "lodash/split.js";

import type { CalendarEventRecord } from "../sanity/get-calendar-events.ts";

const CHICAGO = "America/Chicago";

export type CalendarCell = {
  readonly current: boolean;
  readonly day: number;
  readonly month: number;
  readonly year: number;
};

export const formatDateTime = (iso: string) => {
  return DateTime.format(DateTime.unsafeMake(iso), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: CHICAGO
  });
};

export const toDateKey = (year: number, month: number, day: number) => {
  return `${year}-${padStart(String(month), 2, "0")}-${padStart(String(day), 2, "0")}`;
};

const addToDateMap = (
  dateMap: Map<string, CalendarEventRecord[]>,
  key: string,
  event: CalendarEventRecord
) => {
  if (!dateMap.has(key)) dateMap.set(key, []);
  dateMap.get(key)?.push(event);
};

export const buildEventsByDate = (events: CalendarEventRecord[]) => {
  const dateMap = new Map<string, CalendarEventRecord[]>();

  for (const event of events) {
    const startKey = split(event.startsAt, "T", 1)[0] ?? "";
    const endKey = split(event.endsAt, "T", 1)[0] ?? "";

    let cursor = DateTime.unsafeMake(startKey);
    const end = DateTime.unsafeMake(endKey);

    while (DateTime.lessThanOrEqualTo(cursor, end)) {
      addToDateMap(dateMap, DateTime.formatIsoDate(cursor), event);
      cursor = DateTime.add(cursor, { days: 1 });
    }
  }

  return dateMap;
};

type MonthGridParameters = {
  readonly daysInMonth: number;
  readonly daysInPreviousMonth: number;
  readonly firstDay: number;
  readonly month: number;
  readonly nextMonth: number;
  readonly nextYear: number;
  readonly previousMonth: number;
  readonly previousYear: number;
  readonly year: number;
};

const buildMonthGrid = ({
  daysInMonth,
  daysInPreviousMonth,
  firstDay,
  month,
  nextMonth,
  nextYear,
  previousMonth,
  previousYear,
  year
}: MonthGridParameters): CalendarCell[][] => {
  const cells: CalendarCell[] = [];
  for (let index = firstDay - 1; 0 <= index; index -= 1) {
    cells.push({
      current: false,
      day: daysInPreviousMonth - index,
      month: previousMonth,
      year: previousYear
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

export const buildCalendarWeeks = (
  year: number,
  month: number
): CalendarCell[][] => {
  if (1 > month || 12 < month || !Number.isSafeInteger(month)) {
    return [];
  }

  const firstOfMonth = DateTime.unsafeMake({ day: 1, month, year });
  const firstDay = DateTime.toPartsUtc(firstOfMonth).weekDay % 7;
  const daysInMonth = DateTime.toPartsUtc(
    DateTime.endOf(firstOfMonth, "month")
  ).day;
  const lastOfPreviousMonth = DateTime.subtract(firstOfMonth, { days: 1 });
  const daysInPreviousMonth = DateTime.toPartsUtc(lastOfPreviousMonth).day;

  const previousMonth = 1 === month ? 12 : month - 1;
  const previousYear = 1 === month ? year - 1 : year;
  const nextMonth = 12 === month ? 1 : month + 1;
  const nextYear = 12 === month ? year + 1 : year;

  return buildMonthGrid({
    daysInMonth,
    daysInPreviousMonth,
    firstDay,
    month,
    nextMonth,
    nextYear,
    previousMonth,
    previousYear,
    year
  });
};

export const getViewDateRange = (
  view: "day" | "month" | "week",
  year: number,
  month: number,
  date: string
): { rangeEndExclusive: string; rangeStart: string } => {
  if ("day" === view) {
    return { rangeEndExclusive: shiftDate(date, 1), rangeStart: date };
  }
  if ("week" === view) {
    const weekDays = getWeekDays(date);
    const { 0: firstDay, 6: lastDay } = weekDays;
    return {
      rangeEndExclusive: shiftDate(isNil(lastDay) ? date : lastDay, 1),
      rangeStart: isNil(firstDay) ? date : firstDay
    };
  }
  // Month view: use the full visible grid including leading/trailing days from adjacent months.
  const firstOfMonth = DateTime.unsafeMake({ day: 1, month, year });
  const firstWeekday = DateTime.toPartsUtc(firstOfMonth).weekDay % 7;
  const gridStart = DateTime.subtract(firstOfMonth, { days: firstWeekday });
  const lastOfMonth = DateTime.endOf(firstOfMonth, "month");
  const lastWeekday = DateTime.toPartsUtc(lastOfMonth).weekDay % 7;
  const gridEndExclusive = DateTime.add(lastOfMonth, { days: 7 - lastWeekday });
  return {
    rangeEndExclusive: DateTime.formatIsoDate(gridEndExclusive),
    rangeStart: DateTime.formatIsoDate(gridStart)
  };
};

export const renderDescriptionHtml = (
  description: CalendarEventRecord["description"]
): string => {
  if (!description) return "";
  const blocks = isArray(description) ? description : [description];
  return toHTML(blocks, { components: { types: { image: constant("") } } });
};

export const shiftDate = (dateString: string, days: number): string => {
  return DateTime.formatIsoDate(
    DateTime.add(DateTime.unsafeMake(dateString), { days })
  );
};

export const getWeekDays = (dateString: string): string[] => {
  const maybeAnchor = DateTime.make(dateString);
  if (Option.isNone(maybeAnchor)) return [];

  const anchor = maybeAnchor.value;
  const weekday = DateTime.toPartsUtc(anchor).weekDay % 7;
  const sunday = DateTime.subtract(anchor, { days: weekday });
  return Array.from({ length: 7 }, (_, index) => {
    return DateTime.formatIsoDate(DateTime.add(sunday, { days: index }));
  });
};

export const formatTimeOnly = (iso: string): string => {
  return DateTime.format(DateTime.unsafeMake(iso), {
    hour: "numeric",
    minute: "2-digit",
    timeZone: CHICAGO
  });
};

export const formatDayHeading = (dateString: string): string => {
  return DateTime.format(
    DateTime.unsafeMakeZoned(dateString, {
      adjustForTimeZone: true,
      timeZone: CHICAGO
    }),
    {
      day: "numeric",
      month: "long",
      timeZone: CHICAGO,
      weekday: "long",
      year: "numeric"
    }
  );
};

export const formatWeekHeading = (dateString: string): string => {
  const days = getWeekDays(dateString);
  const { 0: firstDay, 6: lastDay } = days;
  if (isNil(firstDay) || isNil(lastDay) || "" === firstDay || "" === lastDay) {
    return "";
  }
  const startDate = DateTime.unsafeMakeZoned(firstDay, {
    adjustForTimeZone: true,
    timeZone: CHICAGO
  });
  const endDate = DateTime.unsafeMakeZoned(lastDay, {
    adjustForTimeZone: true,
    timeZone: CHICAGO
  });

  const start = DateTime.format(startDate, {
    day: "numeric",
    month: "short",
    timeZone: CHICAGO
  });
  const end = DateTime.format(endDate, {
    day: "numeric",
    month: "short",
    timeZone: CHICAGO,
    year: "numeric"
  });
  return `${start} – ${end}`;
};

export const toPlainText = (
  description: CalendarEventRecord["description"]
): string => {
  if (!description) return "";
  const blocks = isArray(description) ? description : [description];
  return map(
    filter(blocks, (b) => {
      return "block" === b._type;
    }),
    (b) => {
      return map(b.children, (child) => {
        return "text" in child && isString(child.text) ? child.text : "";
      }).join("");
    }
  ).join("\n");
};
