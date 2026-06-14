import type { PortableTextBlock } from "@portabletext/types";

import { toPlainText } from "@portabletext/react";
import { createClient } from "@sanity/client";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import { DateTime } from "luxon";
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

    const events = map(data, (item) => {
      const startDate = DateTime.fromISO(item.startsAt, { zone });
      const endDate = DateTime.fromISO(item.endsAt, { zone });

      const event: IcsEvent = {
        description: isNil(item.description)
          ? ""
          : sanitizeInput(toPlainText(item.description)),
        stamp: { date: startDate.toJSDate(), type: "DATE-TIME" },
        start: { date: startDate.toJSDate(), type: "DATE-TIME" },
        summary: sanitizeInput(item.title),
        uid: item._id,
        ...(endDate.isValid
          ? { end: { date: endDate.toJSDate(), type: "DATE-TIME" } }
          : {})
      };

      return event;
    });

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
