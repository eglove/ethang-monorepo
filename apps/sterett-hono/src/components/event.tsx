import { DateTime } from "effect";

import {
  type CalendarEventReturn,
  eventRangeFormat,
  getRelativeDate
} from "../sanity/get-news-and-events.ts";
import { PortableText } from "./portable-text.tsx";

type EventProperties = {
  data: CalendarEventReturn;
};

export const getIsHappeningNow = (start: string, end: string) => {
  const now = DateTime.toEpochMillis(DateTime.unsafeNow());
  const startDt = DateTime.toEpochMillis(DateTime.unsafeMake(start));
  const endDt = DateTime.toEpochMillis(DateTime.unsafeMake(end));
  return startDt <= now && now <= endDt;
};

export const CalendarEvent = async ({ data }: EventProperties) => {
  const isHappeningNow = getIsHappeningNow(data.startsAt, data.endsAt);
  const relative = isHappeningNow
    ? "Happening Now!"
    : getRelativeDate(data.startsAt);

  return (
    <div class="rounded-xl border border-white/10 bg-white/5 p-5">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span class="text-xs font-medium tracking-wide text-white/50 uppercase">
          {relative}
        </span>
        <span class="text-sm text-white/70">
          {eventRangeFormat(data.startsAt, data.endsAt)}
        </span>
      </div>
      <h2 class="text-base font-semibold">{data.title}</h2>
      <div class="mt-3 border-t border-white/10 pt-3">
        <PortableText content={data.description} />
      </div>
    </div>
  );
};
