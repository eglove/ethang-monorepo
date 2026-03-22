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
} from "../../utils/calendar.ts";
import { MainLayout } from "../layouts/main-layout.tsx";

const CHICAGO = "America/Chicago";
const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  // Pre-render all event data for the client-side modal.
  const eventData: Record<
    string,
    {
      descriptionHtml: string;
      endLabel: string;
      startLabel: string;
      title: string;
    }
  > = {};
  for (const event of events) {
    eventData[event._id] = {
      descriptionHtml: renderDescriptionHtml(event.description),
      endLabel: formatDateTime(event.endsAt),
      startLabel: formatDateTime(event.startsAt),
      title: event.title,
    };
  }

  const weeks = buildCalendarWeeks(year, month);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: CHICAGO });

  const previousMonth = 1 === month ? 12 : month - 1;
  const previousYear = 1 === month ? year - 1 : year;
  const nextMonth = 12 === month ? 1 : month + 1;
  const nextYear = 12 === month ? year + 1 : year;
  const monthName = new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
  });

  // Escape </script> to safely embed JSON in a script tag.
  const safeJson = JSON.stringify(eventData).replaceAll(
    /<\/script>/giu,
    String.raw`<\/script>`,
  );

  const navLinkClass =
    "rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors";

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
        <h1 class="text-xl font-bold tracking-wide">
          {monthName} {year}
        </h1>
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
                      onclick={`openCalendarEvent('${event._id}')`}
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

      {/* Native dialog */}
      <dialog id="cal-dialog">
        <div class="flex flex-col gap-4 p-6">
          <div class="flex items-start justify-between gap-4">
            {/* eslint-disable-next-line a11y/heading-has-content */}
            <h2
              id="cal-dialog-title"
              class="text-lg leading-snug font-semibold"
            ></h2>
            <button
              aria-label="Close"
              onclick="document.getElementById('cal-dialog').close()"
              class="shrink-0 rounded-full p-1 text-white/50 transition-colors hover:text-white"
            >
              ✕
            </button>
          </div>
          <div class="space-y-1 text-sm text-white/70">
            <p id="cal-dialog-start"></p>
            <p id="cal-dialog-end"></p>
          </div>
          <div
            id="cal-dialog-description"
            class="prose prose-sm prose-invert"
          ></div>
        </div>
      </dialog>

      {/* Embed event data */}
      <script
        dangerouslySetInnerHTML={{ __html: `const CAL_EVENTS = ${safeJson};` }}
      />

      {/* Dialog interaction */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function () {
  const dialog = document.getElementById('cal-dialog');

  window.openCalendarEvent = function (id) {
    const e = CAL_EVENTS[id];
    if (!e) return;
    document.getElementById('cal-dialog-title').textContent = e.title;
    document.getElementById('cal-dialog-start').textContent = 'Starts: ' + e.startLabel;
    document.getElementById('cal-dialog-end').textContent = 'Ends: ' + e.endLabel;
    document.getElementById('cal-dialog-description').innerHTML = e.descriptionHtml;
    dialog.showModal();
  };

  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) dialog.close();
  });
})();
`,
        }}
      />
    </MainLayout>
  );
};
