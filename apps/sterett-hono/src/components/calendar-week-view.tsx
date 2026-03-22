import map from "lodash/map.js";
import slice from "lodash/slice.js";
import { DateTime } from "luxon";
import { twMerge } from "tailwind-merge";

import type { CalendarEventRecord } from "../sanity/get-calendar-events.ts";

import { formatTimeOnly } from "../utils/calendar.ts";

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const WeekView = async ({
  eventsByDate,
  today,
  weekDays,
}: {
  eventsByDate: Map<string, CalendarEventRecord[]>;
  today: string;
  weekDays: string[];
}) => {
  return (
    <>
      {/* Mobile: vertical day list */}
      <div class="flex flex-col gap-2 md:hidden">
        {map(weekDays, async (dayKey) => {
          const cellEvents = eventsByDate.get(dayKey) ?? [];
          const isToday = dayKey === today;
          const label = DateTime.fromISO(dayKey, {
            zone: "America/Chicago",
          }).toLocaleString(
            { day: "numeric", month: "short", weekday: "short" },
            { locale: "en-US" },
          );

          return (
            <div
              key={dayKey}
              class={twMerge(
                "rounded-lg border border-white/10 bg-white/5 p-3",
                isToday && "bg-white/10",
              )}
            >
              <div class="mb-2 flex items-center gap-2">
                <a
                  href={`/calendar?view=day&date=${dayKey}`}
                  class={twMerge(
                    "text-sm text-white/70 transition-colors hover:text-white hover:underline",
                    isToday && "font-semibold text-white",
                  )}
                >
                  {label}
                </a>
                {isToday && (
                  <span class="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-black">
                    Today
                  </span>
                )}
              </div>
              {0 === cellEvents.length ? (
                <p class="text-xs text-white/60">No events</p>
              ) : (
                <div class="flex flex-col gap-1">
                  {map(cellEvents, async (event) => (
                    <button
                      key={event._id}
                      onclick={`document.getElementById('cal-${event._id}').showModal()`}
                      class="w-full cursor-pointer truncate rounded bg-sky-600/60 px-2 py-1 text-left text-xs text-white transition-colors hover:bg-sky-500/80"
                    >
                      {formatTimeOnly(event.startsAt)} {event.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: 7-column grid */}
      <div class="hidden md:block">
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
          {map(weekDays, async (dayKey) => {
            const cellEvents = eventsByDate.get(dayKey) ?? [];
            const isToday = dayKey === today;
            const dayNumber = Number(dayKey.slice(8, 10));

            return (
              <div
                key={dayKey}
                class={twMerge(
                  "min-h-32 border border-white/5 p-1",
                  isToday && "bg-white/10",
                )}
              >
                <a
                  href={`/calendar?view=day&date=${dayKey}`}
                  class={twMerge(
                    "inline-flex h-6 w-6 items-center justify-center text-xs text-white/60 transition-colors hover:text-white",
                    isToday
                      ? "rounded-full bg-white font-bold text-lake-deep"
                      : "rounded",
                  )}
                >
                  {dayNumber}
                </a>
                <div class="mt-1 flex flex-col gap-0.5">
                  {map(slice(cellEvents, 0, 3), async (event) => (
                    <button
                      key={event._id}
                      onclick={`document.getElementById('cal-${event._id}').showModal()`}
                      class="w-full cursor-pointer truncate rounded bg-sky-600/60 px-1 py-0.5 text-left text-xs text-white transition-colors hover:bg-sky-500/80"
                    >
                      {formatTimeOnly(event.startsAt)} {event.title}
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
          })}
        </div>
      </div>
    </>
  );
};
