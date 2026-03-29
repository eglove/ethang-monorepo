vi.mock(import("./components/pages/calendar-page.tsx"), () => ({
  CalendarPage: vi.fn(constant("")),
}));

vi.mock(import("./components/pages/files-page.tsx"), () => ({
  FilesPage: vi.fn(constant("")),
}));

vi.mock(import("./components/pages/home-page.tsx"), () => ({
  HomePage: vi.fn(constant("")),
}));

vi.mock(import("./components/pages/news-page.tsx"), () => ({
  NewsPage: vi.fn(constant("")),
}));

vi.mock(import("./components/pages/trustees-page.tsx"), () => ({
  TrusteesPage: vi.fn(constant("")),
}));

import constant from "lodash/constant.js";
import { describe, expect, it, vi } from "vitest";

import { CalendarPage } from "./components/pages/calendar-page.tsx";
import app from "./index.tsx";

const BASE = "http://localhost";
const SITEMAP_URL = `${BASE}/sitemap.xml`;
const SITE_BASE = "https://sterettcreekvillagetrustee.com";
const ADMIN_REDIRECT = "https://admin.sterettcreekvillagetrustee.com";
const JSON_CONTENT_TYPE = { "Content-Type": "application/json" };

describe("app routes", () => {
  it("gET / renders home page", async () => {
    const response = await app.request(`${BASE}/`);

    expect(response.status).toBe(200);
  });

  it("gET /news renders news page", async () => {
    const response = await app.request(`${BASE}/news`);

    expect(response.status).toBe(200);
  });

  it("pOST /news-preview returns 404 when test routes are disabled", async () => {
    const response = await app.request(
      `${BASE}/news-preview`,
      { body: "[]", headers: JSON_CONTENT_TYPE, method: "POST" },
      {},
    );

    expect(response.status).toBe(404);
  });

  it("pOST /news-preview renders news page when test routes are enabled", async () => {
    const response = await app.request(
      `${BASE}/news-preview`,
      { body: "[]", headers: JSON_CONTENT_TYPE, method: "POST" },
      { ENABLE_TEST_ROUTES: "true" },
    );

    expect(response.status).toBe(200);
  });

  it("gET /files renders files page", async () => {
    const response = await app.request(`${BASE}/files`);

    expect(response.status).toBe(200);
  });

  it("gET /calendar renders calendar page with default params", async () => {
    const response = await app.request(`${BASE}/calendar`);

    expect(response.status).toBe(200);
  });

  it("gET /calendar passes through a valid week view param", async () => {
    vi.mocked(CalendarPage).mockClear();
    await app.request(`${BASE}/calendar?view=week&date=2024-06-17`);

    expect(vi.mocked(CalendarPage)).toHaveBeenCalledWith(
      expect.objectContaining({ view: "week" }),
    );
  });

  it("gET /calendar falls back to month for an invalid view param", async () => {
    vi.mocked(CalendarPage).mockClear();
    await app.request(`${BASE}/calendar?view=unknown`);

    expect(vi.mocked(CalendarPage)).toHaveBeenCalledWith(
      expect.objectContaining({ view: "month" }),
    );
  });

  it("gET /calendar passes through a day view param", async () => {
    vi.mocked(CalendarPage).mockClear();
    await app.request(`${BASE}/calendar?view=day&date=2024-06-17`);

    expect(vi.mocked(CalendarPage)).toHaveBeenCalledWith(
      expect.objectContaining({ view: "day" }),
    );
  });

  it("gET /calendar returns 500 when CalendarPage throws", async () => {
    vi.mocked(CalendarPage).mockImplementationOnce(() => {
      throw new Error("render error");
    });
    const response = await app.request(`${BASE}/calendar`);

    expect(response.status).toBe(500);
  });

  it("gET /trustees renders trustees page", async () => {
    const response = await app.request(`${BASE}/trustees`);

    expect(response.status).toBe(200);
  });

  it("gET /admin redirects to the admin site", async () => {
    const response = await app.request(`${BASE}/admin`);

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(ADMIN_REDIRECT);
  });

  it("gET /sitemap.xml returns XML with correct content type", async () => {
    const response = await app.request(SITEMAP_URL);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/xml");
  });

  it("gET /sitemap.xml includes all page URLs", async () => {
    const response = await app.request(SITEMAP_URL);
    const text = await response.text();

    expect(text).toContain(`<loc>${SITE_BASE}/</loc>`);
    expect(text).toContain(`<loc>${SITE_BASE}/news</loc>`);
    expect(text).toContain(`<loc>${SITE_BASE}/calendar</loc>`);
    expect(text).toContain(`<loc>${SITE_BASE}/files</loc>`);
    expect(text).toContain(`<loc>${SITE_BASE}/trustees</loc>`);
  });

  it("gET /sitemap.xml wraps URLs in a urlset element", async () => {
    const response = await app.request(SITEMAP_URL);
    const text = await response.text();

    expect(text).toContain("<urlset");
    expect(text).toContain("</urlset>");
  });
});
