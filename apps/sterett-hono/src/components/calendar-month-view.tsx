import map from "lodash/map.js";
import slice from "lodash/slice.js";
import { twMerge } from "tailwind-merge";

import type { CalendarEventRecord } from "../sanity/get-calendar-events.ts";

import { type CalendarCell, toDateKey } from "../utils/calendar.ts";

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const MonthView = async ({
  eventsByDate,
  today,
  weeks,
}: {
  eventsByDate: Map<string, CalendarEventRecord[]>;
  today: string;
  weeks: CalendarCell[][];
}) => {
  return (
    <>
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
      <div class="grid grid-cols-7">
        {map(weeks, (week) =>
          map(week, async (cell) => {
            const key = toDateKey(cell.year, cell.month, cell.day);
            const cellEvents = eventsByDate.get(key) ?? [];
            const isToday = key === today;

            return (
              <div
                key={key}
                class={twMerge(
                  "min-h-16 border border-white/5 p-1",
                  !cell.current && "opacity-30",
                  isToday && "bg-white/10",
                )}
              >
                <span
                  class={twMerge(
                    "text-xs text-white/60",
                    isToday &&
                      "inline-flex h-5 w-5 items-center justify-center rounded-full bg-white font-bold text-lake-deep",
                  )}
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
                    <span class="text-xs text-white/60">
                      +{cellEvents.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          }),
        )}
      </div>
    </>
  );
};
