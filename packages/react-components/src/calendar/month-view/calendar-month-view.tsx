import {
  ScrollArea,
  ScrollAreaCorner,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@radix-ui/react-scroll-area";
import filter from "lodash/filter";
import isEmpty from "lodash/isEmpty";
import map from "lodash/map";
import { DateTime } from "luxon";
import { twMerge } from "tailwind-merge";

import type { CalendarEvent } from "../calendar-types.ts";

import { getCalendarDaysForMonth } from "../../util/get-calendar-days-for-month.ts";
import { CalendarEventModal } from "../calendar-event-modal.tsx";
import { useCalendarStore } from "../calendar-store.ts";
import { CalendarMonthViewHeading } from "./calendar-month-view-heading.tsx";

type CalendarDaysProperties = {
  events: CalendarEvent[];
};

export const CalendarMonthView = ({
  events,
}: Readonly<CalendarDaysProperties>) => {
  const calendarStoreSubscription = useCalendarStore();
  const now = DateTime.local();
  const calendarDays = getCalendarDaysForMonth(
    calendarStoreSubscription.selectedMonth,
  );

  return (
    <>
      <CalendarMonthViewHeading />
      <ScrollArea className="flex bg-gray-200 text-xs/6 text-gray-700">
        <div className="grid w-full grid-cols-7 border-1 border-t-0 gap-px">
          {map(calendarDays, (day) => {
            const isCurrentMonth =
              day.month === calendarStoreSubscription.selectedMonth.month;
            const isToday = day.toISODate() === now.toISODate();
            const daysEvents = filter(events, (event) => {
              return (
                DateTime.fromJSDate(event.start).toISODate() === day.toISODate()
              );
            });

            return (
              <div
                className={twMerge(
                  isCurrentMonth ? "bg-white" : "bg-gray-50",
                  isToday && "font-semibold text-white",
                  "min-w-0 rounded-none border-0 flex h-40 flex-col px-3 py-2 hover:bg-gray-100 focus:z-10 justify-start",
                )}
                key={String(day.toISO())}
              >
                <time
                  className={twMerge(
                    isToday && "bg-primary text-primary-foreground",
                    "ml-auto flex size-6 items-center justify-center rounded-full",
                  )}
                  dateTime={String(day.toISODate())}
                >
                  {day.day}
                </time>
                <ScrollAreaViewport>
                  <span className="sr-only">{events.length} events</span>
                  {!isEmpty(daysEvents) && (
                    <ol className="mt-2 grid gap-1 overflow-y-auto">
                      {map(daysEvents, (event) => {
                        return (
                          <CalendarEventModal event={event} key={event.id} />
                        );
                      })}
                    </ol>
                  )}
                </ScrollAreaViewport>
                <ScrollAreaScrollbar orientation="vertical">
                  <ScrollAreaThumb />
                </ScrollAreaScrollbar>
                <ScrollAreaScrollbar orientation="horizontal">
                  <ScrollAreaThumb />
                </ScrollAreaScrollbar>
                <ScrollAreaCorner />
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </>
  );
};
