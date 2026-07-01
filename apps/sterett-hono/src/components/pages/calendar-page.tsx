import { DateTime } from "effect";
import includes from "lodash/includes.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import { twMerge } from "tailwind-merge";

import {
  getCalendarEvents,
  getLatestCalendarEventUpdatedAt
} from "../../sanity/get-calendar-events.ts";
import {
  buildCrossViewDate,
  buildNavConfig,
  buildPrefetchUrls,
  type CalendarView
} from "../../utils/calendar-nav.ts";
import {
  buildCalendarWeeks,
  buildEventsByDate,
  getViewDateRange,
  getWeekDays
} from "../../utils/calendar.ts";
import { DayView } from "../calendar-day-view.tsx";
import { CalendarEventDialog } from "../calendar-event-dialog.tsx";
import { MonthView } from "../calendar-month-view.tsx";
import { WeekView } from "../calendar-week-view.tsx";
import { MainLayout } from "../layouts/main-layout.tsx";

const CHICAGO = "America/Chicago";

const tabClass = (isActive: boolean) => {
  return twMerge(
    "rounded-md px-4 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white",
    isActive && "bg-white/20 font-medium text-white"
  );
};

export const CalendarPage = async ({
  date,
  month,
  view,
  year
}: {
  date: string;
  month: number;
  view: CalendarView;
  year: number;
}) => {
  const { rangeEndExclusive, rangeStart } = getViewDateRange(
    view,
    year,
    month,
    date
  );
  const events = await getCalendarEvents(rangeStart, rangeEndExclusive);
  const updatedAt =
    map(events, (event) => {
      return event._updatedAt;
    })
      .toSorted((a, b) => {
        return a.localeCompare(b);
      })
      .at(-1) ?? (await getLatestCalendarEventUpdatedAt());

  const eventsByDate = buildEventsByDate(events);
  const today = DateTime.formatIsoDate(
    DateTime.unsafeMakeZoned(DateTime.unsafeNow(), { timeZone: CHICAGO })
  );
  if (isNil(today)) throw new Error("Could not determine current date");

  // Month view locals
  const weeks = buildCalendarWeeks(year, month);
  const currentMonthDt = DateTime.toEpochMillis(
    DateTime.unsafeMake({ day: 1, month, year })
  );
  const previousDate = DateTime.subtract(
    DateTime.unsafeMake({ day: 1, month, year }),
    { months: 1 }
  );
  const previousMonth = DateTime.toPartsUtc(previousDate).month;
  const previousYear = DateTime.toPartsUtc(previousDate).year;
  const nextDate = DateTime.add(DateTime.unsafeMake({ day: 1, month, year }), {
    months: 1
  });
  const nextMonth = DateTime.toPartsUtc(nextDate).month;
  const nextYear = DateTime.toPartsUtc(nextDate).year;
  const monthName = DateTime.format(
    DateTime.unsafeMakeZoned(DateTime.unsafeMake({ day: 1, month, year }), {
      timeZone: CHICAGO
    }),
    { month: "long", timeZone: CHICAGO }
  );
  const todayNowParts = DateTime.toPartsUtc(
    DateTime.unsafeMakeZoned(DateTime.unsafeNow(), { timeZone: CHICAGO })
  );
  const todayYear = todayNowParts.year;
  const todayMonth = todayNowParts.month;
  const isCurrentMonth = year === todayYear && month === todayMonth;

  // Week view locals
  const weekDays = getWeekDays(date);
  const isCurrentWeek = includes(weekDays, today);

  // Day view locals
  const isToday = date === today;

  const crossViewDt = buildCrossViewDate(view, date, currentMonthDt);
  const crossViewDate = DateTime.formatIsoDate(
    DateTime.unsafeMake(crossViewDt)
  );
  if (isNil(crossViewDate))
    throw new Error("Could not determine cross-view date");

  const crossViewParts = DateTime.toPartsUtc(DateTime.unsafeMake(crossViewDt));
  const crossViewYear = crossViewParts.year;
  const crossViewMonth = crossViewParts.month;

  const navLinkClass =
    "inline-flex min-h-6 items-center rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors";

  const tabMonthHref = `/calendar?view=month&year=${crossViewYear}&month=${crossViewMonth}`;
  const tabWeekHref = `/calendar?view=week&date=${crossViewDate}`;
  const tabDayHref = `/calendar?view=day&date=${crossViewDate}`;

  const navConfig = buildNavConfig({
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
    year
  });

  const prefetch = buildPrefetchUrls(navConfig, view, {
    tabDayHref,
    tabMonthHref,
    tabWeekHref
  });

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

      {map(events, async (event) => {
        return <CalendarEventDialog event={event} key={event._id} />;
      })}
    </MainLayout>
  );
};
