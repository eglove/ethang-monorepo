import { google, ics, office365, outlook, yahoo } from "calendar-link";
import filter from "lodash/filter.js";
import map from "lodash/map.js";
import slice from "lodash/slice.js";

import { getCalendarEvents } from "../../sanity/get-calendar-events.ts";
import {
  buildCalendarWeeks,
  buildEventsByDate,
  formatDateTime,
  renderDescriptionHtml,
  toDateKey,
  toPlainText,
} from "../../utils/calendar.ts";
import { MainLayout } from "../layouts/main-layout.tsx";

const CHICAGO = "America/Chicago";
const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CAL_SERVICES = [
  { key: "google" as const, label: "Google" },
  { key: "ics" as const, label: "Apple / ICS" },
  { key: "outlook" as const, label: "Outlook" },
  { key: "office365" as const, label: "Office 365" },
  { key: "yahoo" as const, label: "Yahoo" },
];

export const CalendarPage = async ({
  month,
  year,
}: {
  month: number;
  year: number;
}) => {
  const events = await getCalendarEvents();
  const updatedAt = map(events, (calendarEvent) => calendarEvent._updatedAt)
    .toSorted((a, b) => a.localeCompare(b))
    .at(-1);

  const eventsByDate = buildEventsByDate(events);

  const weeks = buildCalendarWeeks(year, month);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: CHICAGO });
  const todayYear = Number(today.slice(0, 4));
  const todayMonth = Number(today.slice(5, 7));
  const isCurrentMonth = year === todayYear && month === todayMonth;

  const previousMonth = 1 === month ? 12 : month - 1;
  const previousYear = 1 === month ? year - 1 : year;
  const nextMonth = 12 === month ? 1 : month + 1;
  const nextYear = 12 === month ? year + 1 : year;
  const monthName = new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
  });

  const navLinkClass =
    "inline-flex min-h-6 items-center rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors";
  const calLinkClass =
    "inline-flex items-center rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors";

  return (
    <MainLayout
      updatedAt={updatedAt}
      title="Sterett Creek Village Trustee | Calendar"
      description="Events calendar for Sterett Creek Village Trustee"
    >
      {/* Calendar header */}
      <div class="mb-4 flex items-center justify-between gap-4">
        <a
          class={navLinkClass}
          href={`/calendar?year=${previousYear}&month=${previousMonth}`}
        >
          ← Prev
        </a>
        <div class="flex flex-col items-center gap-1">
          <h1 class="text-xl font-bold tracking-wide">
            {monthName} {year}
          </h1>
          {!isCurrentMonth && (
            <a
              href={`/calendar?year=${todayYear}&month=${todayMonth}`}
              class="text-xs text-white/50 underline transition-colors hover:text-white"
            >
              Today
            </a>
          )}
        </div>
        <a
          class={navLinkClass}
          href={`/calendar?year=${nextYear}&month=${nextMonth}`}
        >
          Next →
        </a>
      </div>

      {/* Day-of-week headers */}
      <div class="grid grid-cols-7 border-b border-white/10">
        {map(DAY_HEADERS, async (d) => (
          <div
            key={d}
            class="py-2 text-center text-xs font-medium text-white/50"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div class="grid grid-cols-7">
        {map(weeks, (week) =>
          map(week, async (cell) => {
            const key = toDateKey(cell.year, cell.month, cell.day);
            const cellEvents = eventsByDate.get(key) ?? [];
            const isToday = key === today;

            return (
              <div
                key={key}
                class={filter(
                  [
                    "min-h-16 border border-white/5 p-1",
                    cell.current ? "" : "opacity-30",
                    isToday ? "bg-white/10" : "",
                  ],
                  Boolean,
                ).join(" ")}
              >
                <span
                  class={
                    isToday
                      ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-lake-deep"
                      : "text-xs text-white/60"
                  }
                >
                  {cell.day}
                </span>
                <div class="mt-1 flex flex-col gap-0.5">
                  {map(slice(cellEvents, 0, 3), async (event) => (
                    <button
                      key={event._id}
                      onclick={`document.getElementById('cal-${event._id}').showModal()`}
                      class="w-full cursor-pointer truncate rounded bg-sky-600/60 px-1 py-0.5 text-left text-xs text-white transition-colors hover:bg-sky-500/80"
                    >
                      {event.title}
                    </button>
                  ))}
                  {3 < cellEvents.length && (
                    <span class="text-xs text-white/40">
                      +{cellEvents.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          }),
        )}
      </div>

      {map(events, async (event) => {
        const calEvent = {
          description: toPlainText(event.description),
          end: event.endsAt,
          start: event.startsAt,
          title: event.title,
        };
        const links = {
          google: google(calEvent),
          ics: ics(calEvent),
          office365: office365(calEvent),
          outlook: outlook(calEvent),
          yahoo: yahoo(calEvent),
        };

        return (
          <dialog key={event._id} id={`cal-${event._id}`}>
            <div class="flex flex-col gap-4 p-6">
              <div class="flex items-start justify-between gap-4">
                <h2 class="text-lg leading-snug font-semibold">
                  {event.title}
                </h2>
                <button
                  aria-label="Close"
                  onclick={`document.getElementById('cal-${event._id}').close()`}
                  class="shrink-0 rounded-full p-1 text-white/50 transition-colors hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div class="space-y-1 text-sm text-white/70">
                <p>Starts: {formatDateTime(event.startsAt)}</p>
                <p>Ends: {formatDateTime(event.endsAt)}</p>
              </div>
              {event.description && (
                <div
                  class="prose prose-sm prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: renderDescriptionHtml(event.description),
                  }}
                />
              )}
              <div class="flex flex-col gap-2 border-t border-white/10 pt-3">
                <p class="text-xs font-medium text-white/50">
                  Add to my Calendar
                </p>
                <div class="flex flex-wrap gap-2">
                  {map(CAL_SERVICES, async (service) => (
                    <a
                      target="_blank"
                      key={service.key}
                      class={calLinkClass}
                      href={links[service.key]}
                      rel="noopener noreferrer"
                    >
                      {service.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </dialog>
        );
      })}
    </MainLayout>
  );
};
