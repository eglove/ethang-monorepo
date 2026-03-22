import map from "lodash/map.js";

import type { CalendarEventRecord } from "../sanity/get-calendar-events.ts";

import { formatTimeOnly } from "../utils/calendar.ts";

export const DayView = async ({
  events,
}: {
  events: CalendarEventRecord[];
}) => {
  return (
    <div class="flex flex-col gap-3">
      {0 === events.length && (
        <p class="text-sm text-white/60">No events scheduled.</p>
      )}
      {map(events, async (event) => (
        <div
          key={event._id}
          class="rounded-lg border border-white/10 bg-white/5 p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex flex-col gap-1">
              <span class="text-sm font-semibold text-white">
                {event.title}
              </span>
              <span class="text-xs text-white/60">
                {formatTimeOnly(event.startsAt)} –{" "}
                {formatTimeOnly(event.endsAt)}
              </span>
            </div>
            <button
              onclick={`document.getElementById('cal-${event._id}').showModal()`}
              class="shrink-0 rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
