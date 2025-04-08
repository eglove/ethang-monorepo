import type { TypedObject } from "@portabletext/types";

import { createRoute } from "@tanstack/react-router";

import { EmptyContent } from "../components/empty-content.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { rootRoute } from "../router/router.ts";
import { setMeta } from "../util/set-meta.ts";

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
          className="border-0 w-full sm:aspect-video min-h-[80vh] sm:min-h-fit"
          src="https://calendar.google.com/calendar/embed?src=mnutc60ri0h45lj454ap6vca5961oqdp%40import.calendar.google.com&ctz=America%2FChicago"
          title="Sterett Creek Village Trustee Calendar"
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
  path: "/calendar",
});
