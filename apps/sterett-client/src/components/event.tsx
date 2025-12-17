import { CalendarDaysIcon } from "@heroicons/react/24/solid";
import { Card, CardBody, CardFooter, CardHeader, Divider } from "@heroui/react";
import isNil from "lodash/isNil";
import { DateTime } from "luxon";
import { Fragment } from "react";
import { twMerge } from "tailwind-merge";

import type { CalendarEventReturn } from "../sanity/queries/get-news-and-events.ts";

import { getRelativeDate } from "../utilities/date.ts";
import { eventRangeFormat } from "../utilities/event-range-format.ts";
import { AddToCalendar } from "./add-to-calendar.tsx";
import { SanityContent } from "./sanity/sanity-content.tsx";

type EventProperties = {
  readonly colors?: {
    eventBackground?: string;
    eventText?: string;
  };
  readonly data: CalendarEventReturn;
  readonly iconMeta?: {
    alt: string;
    src: string;
  };
};

const happeningNow = "Happening Now!";

const getIsHappeningNow = (start: string, end: string) => {
  const startDiff = DateTime.fromISO(start).diffNow("minutes").minutes;
  const endDiff = DateTime.fromISO(end).diffNow("minutes").minutes;
  const isStartInRange = 0 >= startDiff;
  const isEndInRange = 0 >= endDiff;

  return isStartInRange !== isEndInRange;
};

const relativeTimes = new Map<string, string>();

export const Event = ({ colors, data, iconMeta }: EventProperties) => {
  const isHappeningNow = getIsHappeningNow(data.startsAt, data.endsAt);
  const relativeDate = getRelativeDate(data.startsAt);

  if (!isNil(data.relativeStart) && !relativeTimes.has(data.relativeStart)) {
    relativeTimes.set(data.relativeStart, data._id);
  }

  const backgroundColor = isNil(colors?.eventBackground)
    ? "bg-sky-200"
    : `bg-${colors.eventBackground}`;
  const textColor = isNil(colors?.eventText)
    ? "text-foreground"
    : colors.eventText;

  return (
    <Fragment key={data._id}>
      {data._id === relativeTimes.get(relativeDate) ? (
        <Card
          className={twMerge("text-lg font-bold", backgroundColor, textColor)}
        >
          <CardBody>
            {isHappeningNow ? happeningNow : getRelativeDate(data.startsAt)}
          </CardBody>
        </Card>
      ) : null}
      <Card
        id={data._id}
        className={twMerge("my-4 h-max w-full", backgroundColor)}
      >
        <CardHeader className={twMerge("block", textColor)}>
          <strong className="flex flex-wrap gap-2">
            {isNil(iconMeta) ? (
              <CalendarDaysIcon width={24} height={24} />
            ) : (
              <img
                width={20}
                height={20}
                alt={iconMeta.alt}
                src={iconMeta.src}
              />
            )}
            <span>{eventRangeFormat(data.startsAt, data.endsAt)}</span>
          </strong>
          <br />
          <div className="font-semibold">{data.title}</div>
        </CardHeader>
        {!isNil(data.description) && (
          <>
            <Divider />
            <CardBody>
              <SanityContent styleNames={textColor} value={data.description} />
            </CardBody>
          </>
        )}
        <Divider />
        <CardFooter className="flex flex-wrap gap-2">
          <AddToCalendar
            end={data.endsAt}
            title={data.title}
            start={data.startsAt}
            description={data.description}
            buttonProps={{
              className: "bg-sky-600 text-white",
              size: "sm",
            }}
          />
        </CardFooter>
      </Card>
    </Fragment>
  );
};
