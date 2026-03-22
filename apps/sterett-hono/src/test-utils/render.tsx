import { Hono } from "hono";

import type { FileRecord } from "../sanity/get-files.ts";
import type {
  CalendarEventReturn,
  NewsUpdateReturn,
} from "../sanity/get-news-and-events.ts";
import type { TrusteeRecord } from "../sanity/get-trustees.ts";

import { CalendarEvent } from "../components/event.tsx";
import { FileTable } from "../components/file-table.tsx";
import { NewsUpdate } from "../components/news-update.tsx";
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
