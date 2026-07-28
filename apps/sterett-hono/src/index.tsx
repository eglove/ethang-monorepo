import { DateTime, Effect, Number, Option, pipe } from "effect";
import { Hono } from "hono";
import { validator } from "hono/validator";
import constant from "lodash/constant.js";
import includes from "lodash/includes.js";
import isArray from "lodash/isArray.js";
import isNil from "lodash/isNil.js";
import last from "lodash/last.js";
import map from "lodash/map.js";

import type { NewsAndEvents } from "./sanity/get-news-and-events.ts";

import { CalendarPage } from "./components/pages/calendar-page.tsx";
import { FilesPage } from "./components/pages/files-page.tsx";
import { HomePage } from "./components/pages/home-page.tsx";
import { NewsPage } from "./components/pages/news-page.tsx";
import { TrusteesPage } from "./components/pages/trustees-page.tsx";
import { lastModifiedMiddleware } from "./middleware/last-modified.ts";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(lastModifiedMiddleware);

const CALENDAR_VIEWS = ["day", "month", "week"] as const;
type CalendarView = (typeof CALENDAR_VIEWS)[number];
const isCalendarView = (v: string): v is CalendarView => {
  return includes(CALENDAR_VIEWS, v);
};

const lastQuery = (value: null | string | string[]) => {
  /* v8 ignore next -- defensive guard: Hono's validator yields either a non-empty array or a single string for repeated query params, never an empty array */
  return isArray(value) ? (last(value) ?? null) : value;
};

app.get("/", async (c) => {
  return c.html(<HomePage />);
});
app.get("/news", async (c) => {
  return c.html(<NewsPage />);
});

app.post("/news-preview", async (c) => {
  if ("true" !== c.env.ENABLE_TEST_ROUTES) {
    return c.text("Not Found", 404);
  }
  const items = await c.req.json<NewsAndEvents>();
  return c.html(<NewsPage items={items} />);
});
app.get("/files", async (c) => {
  return c.html(<FilesPage />);
});
app.get(
  "/calendar",
  validator("query", (value) => {
    const chicagoTime = DateTime.formatIsoDate(
      DateTime.unsafeMakeZoned(DateTime.unsafeNow(), {
        timeZone: "America/Chicago"
      })
    );
    const rawView = lastQuery(value["view"] ?? null) ?? "month";
    const nowParts = DateTime.toPartsUtc(
      DateTime.unsafeMakeZoned(DateTime.unsafeNow(), {
        timeZone: "America/Chicago"
      })
    );
    const rawMonth = lastQuery(value["month"] ?? null);
    const rawYear = lastQuery(value["year"] ?? null);
    return {
      date: lastQuery(value["date"] ?? null) ?? chicagoTime,
      /* v8 ignore next -- fallback branch when query param is non-numeric string */
      month: isNil(rawMonth)
        ? nowParts.month
        : Option.getOrElse(Number.parse(rawMonth), constant(nowParts.month)),
      view: isCalendarView(rawView) ? rawView : "month",
      /* v8 ignore next -- fallback branch when query param is non-numeric string */
      year: isNil(rawYear)
        ? nowParts.year
        : Option.getOrElse(Number.parse(rawYear), constant(nowParts.year))
    };
  }),
  async (c) => {
    const renderWorkflow = pipe(
      Effect.tryPromise({
        catch: (error) => {
          return error;
        },
        try: async () => {
          const { date, month, view, year } = c.req.valid("query");

          return c.html(
            <CalendarPage date={date} view={view} year={year} month={month} />
          );
        }
      }),
      Effect.catchAll(() => {
        return Effect.succeed(c.text("Internal error", 500));
      })
    );

    return Effect.runPromise(renderWorkflow);
  }
);
app.get("/trustees", async (c) => {
  return c.html(<TrusteesPage />);
});
app.get("/admin", (c) => {
  return c.redirect("https://admin.sterettcreekvillagetrustee.com", 301);
});

app.get("/sitemap.xml", (c) => {
  const base = "https://sterettcreekvillagetrustee.com";
  const pages = [
    { changefreq: "weekly", path: "/", priority: "1.0" },
    { changefreq: "weekly", path: "/news", priority: "0.8" },
    { changefreq: "weekly", path: "/calendar", priority: "0.8" },
    { changefreq: "monthly", path: "/files", priority: "0.6" },
    { changefreq: "monthly", path: "/trustees", priority: "0.6" }
  ];

  const urls = map(pages, ({ changefreq, path, priority }) => {
    return `
  <url>
    <loc>${base}${path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join("");

  c.header("Content-Type", "application/xml; charset=utf-8");
  return c.body(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}\n</urlset>`
  );
});

export default app;
