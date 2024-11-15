import type { PortableTextBlock } from "@portabletext/types";

import { CalendarDaysIcon } from "@heroicons/react/24/solid";
import { Card, CardBody, CardFooter, CardHeader } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import isNil from "lodash/isNil";
import { DateTime } from "luxon";
import { Fragment } from "react";
import { twMerge } from "tailwind-merge";

import type { CalendarEventReturn } from "../sanity/queries/get-news-and-events.ts";

import { getRelativeDate } from "../util/date.ts";
import { eventRangeFormat } from "../util/event-range-format.ts";
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

export const Event = ({
  colors,
  data,
  iconMeta,
}: EventProperties) => {
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
      {data._id === relativeTimes.get(relativeDate)
        ? (
          <Card
            className={twMerge("text-lg font-bold", backgroundColor, textColor)}
          >
            <CardBody>
              {isHappeningNow
                ? happeningNow
                : getRelativeDate(data.startsAt)}
            </CardBody>
          </Card>
        )
        : null}
      <Card
        className={twMerge("my-4 h-max w-full", backgroundColor)}
        id={data._id}
      >
        <CardHeader className={twMerge("block", textColor)}>
          <strong className="flex flex-wrap gap-2">
            {isNil(iconMeta)
              ? (
                <CalendarDaysIcon
                  height={24}
                  width={24}
                />
              )
              : (
                <img
                  alt={iconMeta.alt}
                  height={20}
                  src={iconMeta.src}
                  width={20}
                />
              )}
            <span>
              {eventRangeFormat(data.startsAt, data.endsAt)}
            </span>
          </strong>
          <br />
          <div className="font-semibold">
            {data.title}
          </div>
        </CardHeader>
        {!isNil(data.description) && (
          <>
            <Divider />
            <CardBody>
              <SanityContent
                styleNames={textColor}
                value={data.description}
              />
            </CardBody>
          </>
        )}
        <Divider />
        <CardFooter className="flex flex-wrap gap-2">
          <AddToCalendar
            buttonProps={{
              className: "bg-sky-600 text-white",
              size: "sm",
            }}
            description={data.description as unknown as PortableTextBlock}
            end={data.endsAt}
            start={data.startsAt}
            title={data.title}
          />
        </CardFooter>
      </Card>
    </Fragment>
  );
};
