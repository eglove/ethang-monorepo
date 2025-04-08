import type { TypedObject } from "@portabletext/types";

import { createRoute } from "@tanstack/react-router";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { EmptyContent } from "../components/empty-content.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { rootRoute } from "../router/router.ts";
import { getCalendarEventsQueryOptions } from "../sanity/queries/get-calendar-events.ts";
import { getRouteQueries } from "../util/get-route-queries.ts";
import { setMeta } from "../util/set-meta.ts";

export const calendarRouteQueries = {
  calendarEvents: getCalendarEventsQueryOptions(),
};

export type CalendarComponentEvent = {
  description?: TypedObject | TypedObject[];
  end: Date;
  start: Date;
  title: string;
};

export const CalendarRoute = () => {
  return (
    <MainLayout>
      <div className="mx-auto my-4 max-w-7xl rounded-lg bg-gray-50 shadow-sm shadow-sky-50">
        {/* eslint-disable-next-line react/dom/no-missing-iframe-sandbox */}
        <iframe
          className="border-0 w-full"
          height="600"
          src="https://calendar.google.com/calendar/embed?src=8nuhhppu7uuasur8teo01k6dgg62a4bu%40import.calendar.google.com&ctz=America%2FChicago"
          title="Sterett Creek Village Trustee Calendar"
          width="800"
        ></iframe>
      </div>
    </MainLayout>
  );
};

export const calendarRoute = createRoute({
  beforeLoad() {
    setMeta({
      description: "Events calendar for Sterett Creek Village Trustee",
      title: "Sterett Creek Village Trustee | Calendar",
    });
  },
  component: CalendarRoute,
  errorComponent: EmptyContent,
  getParentRoute: () => {
    return rootRoute;
  },
  async loader() {
    // @ts-expect-error it's fine
    return getRouteQueries(calendarRouteQueries);
  },
  path: "/calendar",
});
