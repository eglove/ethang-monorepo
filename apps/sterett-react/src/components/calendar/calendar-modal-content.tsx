import isNil from "lodash/isNil";
import { DateTime } from "luxon";

import type { CalendarComponentEvent } from "../../routes/calendar.tsx";

import { AMERICA_CHICAGO } from "../../util/date.ts";
import { SanityContent } from "../sanity/sanity-content.tsx";

type CalendarModalContentProperties = {
  readonly selectedEvent: CalendarComponentEvent;
};

export const CalendarModalContent = ({
  selectedEvent,
}: CalendarModalContentProperties) => {
  return (
    <>
      <div>
        <p className="leading-relaxed">
          Starts:
          {" "}
          {DateTime.fromJSDate(selectedEvent.start, {
            zone: AMERICA_CHICAGO,
          }).toLocaleString({
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
        <p className="leading-relaxed">
          Ends:
          {" "}
          {DateTime.fromJSDate(selectedEvent.end, {
            zone: AMERICA_CHICAGO,
          }).toLocaleString({
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>
      {!isNil(selectedEvent.description) &&
        <SanityContent value={selectedEvent.description} />}
    </>
  );
};
