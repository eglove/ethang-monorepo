import filter from "lodash/filter.js";
import isNil from "lodash/isNil.js";
import { DateTime } from "luxon";

import { formatDayHeading, formatWeekHeading, shiftDate } from "./calendar.ts";

const CHICAGO = "America/Chicago";

export type NavConfig = {
  heading: string;
  nextHref: string;
  prevHref: string;
  showToday: boolean;
  todayHref: string;
};

type BuildNavConfigArguments = {
  date: string;
  isCurrentMonth: boolean;
  isCurrentWeek: boolean;
  isToday: boolean;
  month: number;
  monthName: string;
  nextMonth: number;
  nextYear: number;
  previousMonth: number;
  previousYear: number;
  today: string;
  view: CalendarView;
  year: number;
};

type CalendarView = "day" | "month" | "week";

type TabHrefs = {
  tabDayHref: string;
  tabMonthHref: string;
  tabWeekHref: string;
};

export const buildCrossViewDate = (
  view: CalendarView,
  date: string,
  currentMonthDt: DateTime,
): DateTime => {
  return "month" === view
    ? currentMonthDt
    : DateTime.fromISO(date, { zone: CHICAGO });
};

export const buildNavConfig = ({
  date,
  isCurrentMonth,
  isCurrentWeek,
  isToday,
  monthName,
  nextMonth,
  nextYear,
  previousMonth,
  previousYear,
  today,
  view,
  year,
}: BuildNavConfigArguments): NavConfig => {
  const todayDt = DateTime.fromISO(today, { zone: CHICAGO });
  const todayYear = todayDt.year;
  const todayMonth = todayDt.month;

  const NAV_CONFIGS: Record<CalendarView, NavConfig> = {
    day: {
      heading: formatDayHeading(date),
      nextHref: `/calendar?view=day&date=${shiftDate(date, 1)}`,
      prevHref: `/calendar?view=day&date=${shiftDate(date, -1)}`,
      showToday: !isToday,
      todayHref: `/calendar?view=day&date=${today}`,
    },
    month: {
      heading: `${monthName} ${year}`,
      nextHref: `/calendar?view=month&year=${nextYear}&month=${nextMonth}`,
      prevHref: `/calendar?view=month&year=${previousYear}&month=${previousMonth}`,
      showToday: !isCurrentMonth,
      todayHref: `/calendar?view=month&year=${todayYear}&month=${todayMonth}`,
    },
    week: {
      heading: formatWeekHeading(date),
      nextHref: `/calendar?view=week&date=${shiftDate(date, 7)}`,
      prevHref: `/calendar?view=week&date=${shiftDate(date, -7)}`,
      showToday: !isCurrentWeek,
      todayHref: `/calendar?view=week&date=${today}`,
    },
  };

  return NAV_CONFIGS[view];
};

export const buildPrefetchUrls = (
  navConfig: NavConfig,
  view: CalendarView,
  { tabDayHref, tabMonthHref, tabWeekHref }: TabHrefs,
): string[] => {
  return filter(
    [
      navConfig.prevHref,
      navConfig.nextHref,
      "month" === view ? null : tabMonthHref,
      "week" === view ? null : tabWeekHref,
      "day" === view ? null : tabDayHref,
    ],
    (value): value is string => !isNil(value),
  );
};
