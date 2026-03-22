import filter from "lodash/filter.js";
import includes from "lodash/includes.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import { DateTime } from "luxon";
import { twMerge } from "tailwind-merge";

import { getCalendarEvents } from "../../sanity/get-calendar-events.ts";
import {
  buildCalendarWeeks,
  buildEventsByDate,
  formatDayHeading,
  formatWeekHeading,
  getViewDateRange,
  getWeekDays,
  shiftDate,
} from "../../utils/calendar.ts";
import { DayView } from "../calendar-day-view.tsx";
import { CalendarEventDialog } from "../calendar-event-dialog.tsx";
import { MonthView } from "../calendar-month-view.tsx";
import { WeekView } from "../calendar-week-view.tsx";
import { MainLayout } from "../layouts/main-layout.tsx";

const CHICAGO = "America/Chicago";

const tabClass = (active: boolean) =>
  twMerge(
    "px-4 py-1.5 text-sm rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors",
    active && "bg-white/20 text-white font-medium",
  );

export const CalendarPage = async ({
  date,
  month,
  view,
  year,
}: {
  date: string;
  month: number;
  view: "day" | "month" | "week";
  year: number;
}) => {
  const { rangeEndExclusive, rangeStart } = getViewDateRange(
    view,
    year,
    month,
    date,
  );
  const events = await getCalendarEvents(rangeStart, rangeEndExclusive);
  const updatedAt = map(events, (event) => event._updatedAt)
    .toSorted((a, b) => a.localeCompare(b))
    .at(-1);

  const eventsByDate = buildEventsByDate(events);
  const todayDt = DateTime.now().setZone(CHICAGO);
  const today = todayDt.toISODate();
  if (isNil(today)) throw new Error("Could not determine current date");

  // Month view locals
  const weeks = buildCalendarWeeks(year, month);
  const currentMonthDt = DateTime.fromObject(
    { day: 1, month, year },
    { zone: CHICAGO },
  );
  const previousMonth = currentMonthDt.minus({ months: 1 }).month;
  const previousYear = currentMonthDt.minus({ months: 1 }).year;
  const nextMonth = currentMonthDt.plus({ months: 1 }).month;
  const nextYear = currentMonthDt.plus({ months: 1 }).year;
  const monthName = currentMonthDt.toLocaleString(
    { month: "long" },
    { locale: "en-US" },
  );
  const todayYear = todayDt.year;
  const todayMonth = todayDt.month;
  const isCurrentMonth = year === todayYear && month === todayMonth;

  // Week view locals
  const weekDays = getWeekDays(date);
  const isCurrentWeek = includes(weekDays, today);

  // Day view locals
  const isToday = date === today;

  // Cross-view navigation: derive a representative date from whatever is currently displayed.
  // On month view the URL has no `date` param, so we use the 1st of the displayed month.
  // On week/day view `date` is already a meaningful ISO date.
  const crossViewDt =
    "month" === view
      ? currentMonthDt
      : DateTime.fromISO(date, { zone: CHICAGO });
  const crossViewDate = crossViewDt.toISODate();
  if (isNil(crossViewDate))
    throw new Error("Could not determine cross-view date");
  const crossViewYear = crossViewDt.year;
  const crossViewMonth = crossViewDt.month;

  const navLinkClass =
    "inline-flex min-h-6 items-center rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors";

  const navConfig = {
    day: {
      heading: formatDayHeading(date),
      nextHref: `/calendar?view=day&date=${shiftDate(date, 1)}`,
      prevHref: `/calendar?view=day&date=${shiftDate(date, -1)}`,
      // Show "Today" when viewing any day other than today
      showToday: !isToday,
      todayHref: `/calendar?view=day&date=${today}`,
    },
    month: {
      heading: `${monthName} ${year}`,
      nextHref: `/calendar?view=month&year=${nextYear}&month=${nextMonth}`,
      prevHref: `/calendar?view=month&year=${previousYear}&month=${previousMonth}`,
      // Show "Today" when the viewed month doesn't contain today
      showToday: !isCurrentMonth,
      todayHref: `/calendar?view=month&year=${todayYear}&month=${todayMonth}`,
    },
    week: {
      heading: formatWeekHeading(date),
      nextHref: `/calendar?view=week&date=${shiftDate(date, 7)}`,
      prevHref: `/calendar?view=week&date=${shiftDate(date, -7)}`,
      // Show "Today" when the viewed week doesn't contain today
      showToday: !isCurrentWeek,
      todayHref: `/calendar?view=week&date=${today}`,
    },
  }[view];

  const tabMonthHref = `/calendar?view=month&year=${crossViewYear}&month=${crossViewMonth}`;
  const tabWeekHref = `/calendar?view=week&date=${crossViewDate}`;
  const tabDayHref = `/calendar?view=day&date=${crossViewDate}`;
  const prefetch = filter(
    [
      navConfig.prevHref,
      navConfig.nextHref,
      "month" === view ? null : tabMonthHref,
      "week" === view ? null : tabWeekHref,
      "day" === view ? null : tabDayHref,
    ],
    (value) => !isNil(value),
  );

  return (
    <MainLayout
      prefetch={prefetch}
      updatedAt={updatedAt}
      title="Sterett Creek Village Trustee | Calendar"
      description="Events calendar for Sterett Creek Village Trustee"
    >
      {/* View switcher */}
      <div class="mx-auto mb-4 flex w-fit gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
        <a href={tabMonthHref} class={tabClass("month" === view)}>
          Month
        </a>
        <a href={tabWeekHref} class={tabClass("week" === view)}>
          Week
        </a>
        <a href={tabDayHref} class={tabClass("day" === view)}>
          Day
        </a>
      </div>

      {/* Navigation header */}
      <div class="mb-4 flex items-center justify-between gap-4">
        <a class={navLinkClass} href={navConfig.prevHref}>
          ← Prev
        </a>
        <div class="flex flex-col items-center gap-1">
          <h1 class="text-xl font-bold tracking-wide">{navConfig.heading}</h1>
          {navConfig.showToday && (
            <a
              href={navConfig.todayHref}
              class="text-xs text-white/50 underline transition-colors hover:text-white"
            >
              Today
            </a>
          )}
        </div>
        <a class={navLinkClass} href={navConfig.nextHref}>
          Next →
        </a>
      </div>

      {"month" === view && (
        <MonthView today={today} weeks={weeks} eventsByDate={eventsByDate} />
      )}

      {"week" === view && (
        <WeekView
          today={today}
          weekDays={weekDays}
          eventsByDate={eventsByDate}
        />
      )}

      {"day" === view && <DayView events={eventsByDate.get(date) ?? []} />}

      {map(events, async (event) => (
        <CalendarEventDialog event={event} key={event._id} />
      ))}
    </MainLayout>
  );
};
