import type { PortableTextBlock } from "@portabletext/types";

import { toPlainText } from "@portabletext/react";
import { createClient } from "@sanity/client";
import { DateTime, Option } from "effect";
import filter from "lodash/filter.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import { generateIcsCalendar, type IcsEvent } from "ts-ics";

type CalendarEventReturn = {
  _id: string;
  description: PortableTextBlock;
  endsAt: string;
  relativeStart?: string;
  startsAt: string;
  title: string;
};

const sanitizeInput = (text: string) => {
  return text.replaceAll("\r", "").replaceAll("\n", " ").replaceAll("\\", "");
};

export default {
  fetch: async (): Promise<Response> => {
    const zone = "America/Chicago";

    const client = createClient({
      apiVersion: "1",
      dataset: "production",
      // cspell:disable-next-line
      projectId: "540gjnt8",
      useCdn: true
    });

    const eventQuery = `
            *[_type == "calendarEvent"
            && !(_id in path('drafts.**'))] | order(startsAt asc){_id, title, startsAt, endsAt, description}`;

    const data = await client.fetch<CalendarEventReturn[]>(eventQuery);

    const events = filter(
      map(data, (item) => {
        const maybeStartDate = DateTime.makeZoned(item.startsAt, {
          timeZone: zone
        });

        if (Option.isNone(maybeStartDate)) {
          return null;
        }

        const maybeEndDate = DateTime.makeZoned(item.endsAt, {
          timeZone: zone
        });

        const startDate = maybeStartDate.value;
        const event: IcsEvent = {
          description: isNil(item.description)
            ? ""
            : sanitizeInput(toPlainText(item.description)),
          stamp: { date: DateTime.toDateUtc(startDate), type: "DATE-TIME" },
          start: { date: DateTime.toDateUtc(startDate), type: "DATE-TIME" },
          summary: sanitizeInput(item.title),
          uid: item._id,
          ...(Option.isSome(maybeEndDate) && {
            end: {
              date: DateTime.toDateUtc(maybeEndDate.value),
              type: "DATE-TIME"
            }
          })
        };

        return event;
      }),
      (event): event is IcsEvent => {
        return !isNil(event);
      }
    );

    const calendar = generateIcsCalendar({
      events,
      name: "Sterett Creek Village Trustee",
      prodId: "sterettcreekvillagetrustee.com",
      version: "2.0"
    });

    return new Response(calendar, {
      headers: {
        "Content-Type": "text/calendar"
      }
    });
  }
} satisfies ExportedHandler<Env>;
