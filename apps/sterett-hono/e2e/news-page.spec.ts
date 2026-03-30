import type { Page } from "@playwright/test";
import type { PortableTextSpan } from "@portabletext/types";

import type { NewsAndEvents } from "../src/sanity/get-news-and-events.ts";

import { expect, test } from "./fixtures.ts";

const NEWS_ITEMS = "main .rounded-xl";
const NEWS_PREVIEW_URL = "http://localhost:8787/news-preview";

const MOCK_NEWS_ITEM: NewsAndEvents = [
  {
    _id: "test-1",
    _updatedAt: "2026-01-01T00:00:00Z",
    date: "2099-12-31",
    description: {
      _type: "block",
      children: [] as PortableTextSpan[],
    },
    title: "Test News Item",
  },
];

const mockNewsPage = async (page: Page, items: NewsAndEvents) => {
  await page.route("**/news", async (route) => {
    const response = await page.request.post(NEWS_PREVIEW_URL, {
      data: items,
      headers: { "Content-Type": "application/json" },
    });
    await route.fulfill({
      body: await response.text(),
      contentType: "text/html",
      status: 200,
    });
  });
};

test.describe("news Page", () => {
  test("renders title and navigation", async ({ page }) => {
    await page.goto("/news");

    await expect.soft(page).toHaveTitle("Sterett Creek Village Trustee | News");
    await expect.soft(page.getByRole("navigation")).toBeVisible();
  });

  test("renders heading", async ({ page }) => {
    await page.goto("/news");

    await expect
      .soft(page.getByRole("heading", { name: "News & Events" }))
      .toBeVisible();
  });

  test("renders news items when content exists", async ({ page }) => {
    await mockNewsPage(page, MOCK_NEWS_ITEM);
    await page.goto("/news");

    await expect.soft(page.locator(NEWS_ITEMS)).not.toHaveCount(0);
  });

  test("renders empty state when no content exists", async ({ page }) => {
    await mockNewsPage(page, []);
    await page.goto("/news");

    await expect
      .soft(page.getByText("No upcoming news or events."))
      .toBeVisible();
  });
});
