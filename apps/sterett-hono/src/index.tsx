import { Hono } from "hono";
import { validator } from "hono/validator";
import includes from "lodash/includes.js";
import isArray from "lodash/isArray.js";
import last from "lodash/last.js";
import map from "lodash/map.js";
import { DateTime } from "luxon";

import { CalendarPage } from "./components/pages/calendar-page.tsx";
import { FilesPage } from "./components/pages/files-page.tsx";
import { HomePage } from "./components/pages/home-page.tsx";
import { NewsPage } from "./components/pages/news-page.tsx";
import { TrusteesPage } from "./components/pages/trustees-page.tsx";

const app = new Hono<{ Bindings: CloudflareBindings }>();

const CALENDAR_VIEWS = ["day", "month", "week"] as const;
type CalendarView = (typeof CALENDAR_VIEWS)[number];
const isCalendarView = (v: string): v is CalendarView => {
  return includes(CALENDAR_VIEWS, v);
};

const lastQuery = (value: string | string[] | undefined): string | undefined =>
  isArray(value) ? last(value) : value;

app.get("/", async (c) => c.html(<HomePage />));
app.get("/news", async (c) => c.html(<NewsPage />));
app.get("/files", async (c) => c.html(<FilesPage />));
app.get(
  "/calendar",
  validator("query", (value) => {
    const now = DateTime.now().setZone("America/Chicago");
    const rawView = lastQuery(value["view"]) ?? "month";
    return {
      date:
        lastQuery(value["date"]) ??
        now.toISODate() ??
        now.toFormat("yyyy-MM-dd"),
      month: Number(lastQuery(value["month"]) ?? now.month),
      view: isCalendarView(rawView) ? rawView : "month",
      year: Number(lastQuery(value["year"]) ?? now.year),
    };
  }),
  async (c) => {
    try {
      const { date, month, view, year } = c.req.valid("query");
      return await c.html(
        <CalendarPage date={date} view={view} year={year} month={month} />,
      );
    } catch {
      return c.text("Internal error", 500);
    }
  },
);
app.get("/trustees", async (c) => c.html(<TrusteesPage />));
app.get("/admin", (c) =>
  c.redirect("https://admin.sterettcreekvillagetrustee.com", 301),
);

app.get("/sitemap.xml", (c) => {
  const base = "https://sterettcreekvillagetrustee.com";
  const pages = [
    { changefreq: "weekly", path: "/", priority: "1.0" },
    { changefreq: "weekly", path: "/news", priority: "0.8" },
    { changefreq: "weekly", path: "/calendar", priority: "0.8" },
    { changefreq: "monthly", path: "/files", priority: "0.6" },
    { changefreq: "monthly", path: "/trustees", priority: "0.6" },
  ];

  const urls = map(
    pages,
    ({ changefreq, path, priority }) => `
  <url>
    <loc>${base}${path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  ).join("");

  c.header("Content-Type", "application/xml; charset=utf-8");
  return c.body(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}\n</urlset>`,
  );
});

export default app;
