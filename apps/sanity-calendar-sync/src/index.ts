import type { PortableTextBlock } from "@portabletext/types";

import { toPlainText } from "@portabletext/react";
import { createClient } from "@sanity/client";
import isNil from "lodash/isNil";
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

export default {
  async fetch(): Promise<Response> {
    const zone = "America/Chicago";

    const client = createClient({
      apiVersion: "1",
      dataset: "production",
      // eslint-disable-next-line cspell/spellchecker
      projectId: "540gjnt8",
      useCdn: true,
    });

    const eventQuery = `
			*[_type == "calendarEvent"
			&& !(_id in path('drafts.**'))] | order(startsAt asc){_id, title, startsAt, endsAt, description}`;

    const data = await client.fetch<CalendarEventReturn[]>(eventQuery);

    const events = map(data, (item) => {
      const startDate = DateTime.fromISO(item.startsAt, { zone });
      const endDate = DateTime.fromISO(item.endsAt, { zone });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      return {
        description: isNil(item.description)
          ? ""
          : toPlainText(item.description)
              .replaceAll("\n", " ")
              .replaceAll("\\", ""),
        end: endDate.isValid
          ? { date: endDate.toJSDate(), type: "DATE-TIME" }
          : undefined,
        stamp: { date: startDate.toJSDate(), type: "DATE-TIME" } as const,
        start: { date: startDate.toJSDate(), type: "DATE-TIME" } as const,
        summary: item.title,
        uid: item._id,
      } as IcsEvent;
    });

    const calendar = generateIcsCalendar({
      events,
      name: "Sterett Creek Village Trustee",
      // eslint-disable-next-line cspell/spellchecker
      prodId: "sterettcreekvillagetrustee.com",
      version: "2.0",
    });

    return new Response(calendar, {
      headers: {
        "Content-Type": "text/calendar",
      },
    });
  },
} satisfies ExportedHandler<Env>;
