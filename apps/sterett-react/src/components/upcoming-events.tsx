import type { PortableTextBlock } from "@portabletext/types";

import { Accordion, AccordionItem } from "@nextui-org/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty";
import isNil from "lodash/isNil";
import map from "lodash/map";

import { indexRouteQueries } from "../routes/home.tsx";
import { eventRangeFormat } from "../util/event-range-format.ts";
import { AddToCalendar } from "./add-to-calendar.tsx";
import { SanityContent } from "./sanity/sanity-content.tsx";

export const UpcomingEvents = () => {
  const { data: events } = useSuspenseQuery(indexRouteQueries.newsAndEvents);

  if (isNil(events) || isEmpty(events)) {
    return null;
  }

  return (
    <>
      <h2 className="text-2xl font-bold">
        Upcoming Events
      </h2>
      <Accordion
        className="grid max-w-3xl place-items-center border-2"
      >
        {map(events, (event) => {
          const hasDates = "startsAt" in event && "endsAt" in event;

          return (
            <AccordionItem
              classNames={{
                content: "prose",
                trigger: `px-2 py-0 ${hasDates
                  ? ""
                  : "font-bold py-2"}`,
              }}
              title={
                <p>
                  <strong>
                    {event.title}
                  </strong>
                  {hasDates &&
                    <>
                      <br />
                      <span>
                        {eventRangeFormat(event.startsAt, event.endsAt)}
                      </span>
                    </>}
                </p>
              }
              aria-label={event.title}
              className="w-full"
              key={event._id}
            >
              {hasDates &&
                <AddToCalendar
                  buttonProps={{
                    className: "bg-sky-600 text-white mb-4",
                    size: "sm",
                  }}
                  description={
                    event.description as unknown as PortableTextBlock
                  }
                  end={event.endsAt}
                  start={event.startsAt}
                  title={event.title}
                />}
              {!isNil(event.description) &&
                <SanityContent
                  styleNames="mb-2"
                  value={event.description}
                />}
            </AccordionItem>
          );
        })}
      </Accordion>
    </>
  );
};
