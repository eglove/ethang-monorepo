import {
  type CalendarEventReturn,
  eventRangeFormat,
  getRelativeDate,
} from "../sanity/get-news-and-events.ts";
import { PortableText } from "./portable-text.tsx";

type EventProperties = {
  data: CalendarEventReturn;
};

export const getIsHappeningNow = (start: string, end: string) => {
  const now = Date.now();
  return new Date(start).getTime() <= now && now <= new Date(end).getTime();
};

export const CalendarEvent = async ({ data }: EventProperties) => {
  const happeningNow = getIsHappeningNow(data.startsAt, data.endsAt);
  const relative = happeningNow
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
