import { useEventListener } from "@ethang/hooks/use-event-listener";
import find from "lodash/find.js";
import map from "lodash/map.js";
import { DateTime } from "luxon";
import { Fragment, useEffect } from "react";

import type { CalendarEvent } from "../calendar-types.ts";

import { getCalendarDaysForWeek } from "../../util/get-calendar-days-for-week.ts";
import { CalendarEventModal } from "../calendar-event-modal.tsx";
import { calendarStore, useCalendarStore } from "../calendar-store.ts";

type CalendarWeekViewProperties = {
  events: CalendarEvent[];
};

const times = [
  "12AM",
  "1AM",
  "2AM",
  "3AM",
  "4AM",
  "5AM",
  "6AM",
  "7AM",
  "8AM",
  "9AM",
  "10AM",
  "11AM",
  "12PM",
  "1PM",
  "2PM",
  "3PM",
  "4PM",
  "5PM",
  "6PM",
  "7PM",
  "8PM",
  "9PM",
  "10PM",
  "11PM",
];

// Helper function to calculate grid row position based on time
const calculateGridRow = (date: Date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  // Each hour takes up 6 rows (2 rows per 30 min slot)
  // Starting at row 2 (after the header)
  return 2 + hours * 12 + Math.floor(minutes / 5);
};

const calculateEventDuration = (start: Date, end: Date) => {
  const durationInMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  // Each 5 minutes takes up 1 row
  return Math.max(Math.ceil(durationInMinutes / 5), 6); // Minimum 6 rows (30 min) for visibility
};

export const CalendarWeekView = ({
  events,
}: Readonly<CalendarWeekViewProperties>) => {
  const calendarStoreSubscription = useCalendarStore();
  const daysForWeek = getCalendarDaysForWeek(
    calendarStoreSubscription.selectedWeek,
  );

  useEventListener("resize", () => {
    if (640 > globalThis.innerWidth) {
      calendarStore.set((state) => {
        state.selectedView = "day";
      });
    }
  });

  useEffect(() => {
    const currentHour = DateTime.local().hour;
    const isPM = 12 <= currentHour;
    const timeId = `${0 === currentHour % 12 ? 12 : currentHour % 12}${isPM ? "PM" : "AM"}`;

    const timeElement = globalThis.document.querySelector(`#time-${timeId}`);
    if (timeElement) {
      timeElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  return (
    <div className="isolate flex flex-auto flex-col bg-white">
      <div className="flex-auto">
        <div className="flex max-w-full flex-none flex-col sm:max-w-none md:max-w-full">
          <div className="flex flex-auto">
            <div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100" />
            <div className="grid flex-auto grid-cols-1 grid-rows-1">
              {/* Horizontal lines */}
              <div
                style={{
                  gridTemplateRows: "repeat(48, minmax(3.5rem, 1fr))",
                }}
                className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
              >
                <div className="row-end-1 h-7"></div>
                {map(times, (time) => {
                  return (
                    <Fragment key={time}>
                      <div>
                        <div
                          className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400"
                          id={`time-${time}`}
                        >
                          {time}
                        </div>
                      </div>
                      <div />
                    </Fragment>
                  );
                })}
              </div>

              {/* Vertical lines */}
              <div className="col-start-1 col-end-2 row-start-1 hidden grid-cols-7 grid-rows-1 divide-x divide-gray-100 sm:grid sm:grid-cols-7">
                <div className="col-start-1 row-span-full" />
                <div className="col-start-2 row-span-full" />
                <div className="col-start-3 row-span-full" />
                <div className="col-start-4 row-span-full" />
                <div className="col-start-5 row-span-full" />
                <div className="col-start-6 row-span-full" />
                <div className="col-start-7 row-span-full" />
                <div className="col-start-8 row-span-full w-8" />
              </div>

              {/* Events */}
              <ol
                style={{
                  gridTemplateRows: "1.75rem repeat(288, minmax(0, 1fr)) auto",
                }}
                className="col-start-1 col-end-2 row-start-1 grid grid-cols-1 sm:grid-cols-7 sm:pr-8"
              >
                {map(events, (event) => {
                  // Find which day of the week this event belongs to
                  const eventDay = find(daysForWeek, (day) => {
                    const dayStart = day.startOf("day").toJSDate();
                    const dayEnd = day.endOf("day").toJSDate();
                    return event.start >= dayStart && event.start <= dayEnd;
                  });

                  // Skip events that don't fall within the current week
                  if (!eventDay) {
                    return null;
                  }

                  // Calculate the column (day of week) for this event (1-based index)
                  const dayIndex = daysForWeek.indexOf(eventDay) + 1;

                  // Calculate grid row position and duration
                  const startRow = calculateGridRow(event.start);
                  const duration = calculateEventDuration(
                    event.start,
                    event.end,
                  );

                  return (
                    <li
                      style={{
                        gridColumn: `${dayIndex} / span 1`,
                        gridRow: `${startRow} / span ${duration}`,
                      }}
                      className="relative mt-px flex"
                      id={`event-${event.id}`}
                      key={event.id}
                    >
                      <CalendarEventModal
                        classNames={{
                          button: "size-full flex flex-col gap-1 border-2",
                        }}
                        event={event}
                      />
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
