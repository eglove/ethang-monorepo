import { toHTML } from "@portabletext/to-html";
import constant from "lodash/constant.js";
import filter from "lodash/filter.js";
import isArray from "lodash/isArray.js";
import map from "lodash/map.js";
import padStart from "lodash/padStart.js";
import slice from "lodash/slice.js";

import {
  type CalendarEventRecord,
  getCalendarEvents,
} from "../../sanity/get-calendar-events.ts";
import { MainLayout } from "../layouts/main-layout.tsx";

const CHICAGO = "America/Chicago";
const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: CHICAGO,
  });

const toDateKey = (year: number, month: number, day: number) =>
  `${year}-${padStart(String(month), 2, "0")}-${padStart(String(day), 2, "0")}`;

// Build a map of YYYY-MM-DD → events[] covering every day an event spans.
const buildEventsByDate = (events: CalendarEventRecord[]) => {
  const _map = new Map<string, CalendarEventRecord[]>();

  for (const event of events) {
    const cursor = new Date(event.startsAt);
    const end = new Date(event.endsAt);
    cursor.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // eslint-disable-next-line no-unmodified-loop-condition
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      if (!_map.has(key)) _map.set(key, []);
      _map.get(key)?.push(event);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return _map;
};

type CalendarCell = {
  current: boolean;
  day: number;
  month: number;
  year: number;
};

const buildCalendarWeeks = (year: number, month: number): CalendarCell[][] => {
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

const renderDescriptionHtml = (
  description: CalendarEventRecord["description"],
): string => {
  if (!description) return "";
  const blocks = isArray(description) ? description : [description];
  return toHTML(blocks, { components: { types: { image: constant("") } } });
};

export const CalendarPage = async ({
  month,
  year,
}: {
  month: number;
  year: number;
}) => {
  const events = await getCalendarEvents();

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
