import { google, ics, office365, outlook, yahoo } from "calendar-link";
import map from "lodash/map.js";

import type { CalendarEventRecord } from "../sanity/get-calendar-events.ts";

import {
  formatDateTime,
  renderDescriptionHtml,
  toPlainText,
} from "../utils/calendar.ts";

const CAL_SERVICES = [
  { key: "google" as const, label: "Google" },
  { key: "ics" as const, label: "Apple / ICS" },
  { key: "outlook" as const, label: "Outlook" },
  { key: "office365" as const, label: "Office 365" },
  { key: "yahoo" as const, label: "Yahoo" },
];

const calLinkClass =
  "inline-flex items-center rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors";

export const CalendarEventDialog = async ({
  event,
}: {
  event: CalendarEventRecord;
}) => {
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
    <dialog id={`cal-${event._id}`}>
      <div class="flex flex-col gap-4 p-6">
        <div class="flex items-start justify-between gap-4">
          <h2 class="text-lg leading-snug font-semibold">{event.title}</h2>
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
          <p class="text-xs font-medium text-white/50">Add to my Calendar</p>
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
};
