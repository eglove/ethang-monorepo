import { Hono } from "hono";

import type { CalendarEventRecord } from "../sanity/get-calendar-events.ts";
import type { FileRecord } from "../sanity/get-files.ts";
import type {
  CalendarEventReturn,
  NewsUpdateReturn,
} from "../sanity/get-news-and-events.ts";
import type { TrusteeRecord } from "../sanity/get-trustees.ts";
import type { CalendarCell } from "../utils/calendar.ts";

import { DayView } from "../components/calendar-day-view.tsx";
import { CalendarEventDialog } from "../components/calendar-event-dialog.tsx";
import { MonthView } from "../components/calendar-month-view.tsx";
import { WeekView } from "../components/calendar-week-view.tsx";
import { CalendarEvent } from "../components/event.tsx";
import { FileTable } from "../components/file-table.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { NewsUpdate } from "../components/news-update.tsx";
import { PortableText } from "../components/portable-text.tsx";
import { TrusteeCard } from "../components/trustee-card.tsx";

// eslint-disable-next-line unicorn/no-await-expression-member
const html = async (app: Hono) => (await app.request("/")).text();

export const renderFileTable = async (files: FileRecord[], title: string) => {
  const app = new Hono();
  app.get("/", async (c) => c.html(<FileTable files={files} title={title} />));
  return html(app);
};

export const renderCalendarEvent = async (data: CalendarEventReturn) => {
  const app = new Hono();
  app.get("/", async (c) => c.html(<CalendarEvent data={data} />));
  return html(app);
};

export const renderNewsUpdate = async (data: NewsUpdateReturn) => {
  const app = new Hono();
  app.get("/", async (c) => c.html(<NewsUpdate data={data} />));
  return html(app);
};

export const renderTrusteeCard = async (trustee: TrusteeRecord) => {
  const app = new Hono();
  app.get("/", async (c) => c.html(<TrusteeCard trustee={trustee} />));
  return html(app);
};

export const renderMainLayout = async (properties: {
  children?: unknown;
  description?: string;
  prefetch?: string[];
  title?: string;
  updatedAt?: string;
}) => {
  const app = new Hono();
  app.get("/", async (c) =>
    c.html(
      // @ts-expect-error for testing
      <MainLayout
        title={properties.title}
        prefetch={properties.prefetch}
        updatedAt={properties.updatedAt}
        description={properties.description}
      >
        {properties.children}
      </MainLayout>,
    ),
  );
  return html(app);
};

export const renderCalendarDayView = async (events: CalendarEventRecord[]) => {
  const app = new Hono();
  app.get("/", async (c) => c.html(<DayView events={events} />));
  return html(app);
};

export const renderCalendarEventDialog = async (event: CalendarEventRecord) => {
  const app = new Hono();
  app.get("/", async (c) => c.html(<CalendarEventDialog event={event} />));
  return html(app);
};

export const renderCalendarMonthView = async (
  weeks: CalendarCell[][],
  eventsByDate: Map<string, CalendarEventRecord[]>,
  today: string,
) => {
  const app = new Hono();
  app.get("/", async (c) =>
    c.html(
      <MonthView today={today} weeks={weeks} eventsByDate={eventsByDate} />,
    ),
  );
  return html(app);
};

export const renderCalendarWeekView = async (
  weekDays: string[],
  eventsByDate: Map<string, CalendarEventRecord[]>,
  today: string,
) => {
  const app = new Hono();
  app.get("/", async (c) =>
    c.html(
      <WeekView
        today={today}
        weekDays={weekDays}
        eventsByDate={eventsByDate}
      />,
    ),
  );
  return html(app);
};

export const renderPortableText = async (
  content: Parameters<typeof PortableText>[0]["content"],
) => {
  const app = new Hono();
  app.get("/", async (c) => c.html(<PortableText content={content} />));
  return html(app);
};
