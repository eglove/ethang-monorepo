import { Hono } from "hono";
import map from "lodash/map.js";

import { CalendarPage } from "./components/pages/calendar-page.tsx";
import { FilesPage } from "./components/pages/files-page.tsx";
import { HomePage } from "./components/pages/home-page.tsx";
import { NewsPage } from "./components/pages/news-page.tsx";
import { TrusteesPage } from "./components/pages/trustees-page.tsx";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/", async (c) => c.html(<HomePage />));
app.get("/news", async (c) => c.html(<NewsPage />));
app.get("/files", async (c) => c.html(<FilesPage />));
app.get("/calendar", async (c) => {
  const now = new Date();
  const year = Number(c.req.query("year") ?? now.getFullYear());
  const month = Number(c.req.query("month") ?? now.getMonth() + 1);
  return c.html(<CalendarPage year={year} month={month} />);
});
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

  return c.body(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}\n</urlset>`,
    200,
    { "Content-Type": "application/xml" },
  );
});

export default app;
