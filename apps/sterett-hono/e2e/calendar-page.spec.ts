import { DateTime } from "luxon";

import { expect, test } from "./fixtures.ts";

const CHICAGO = "America/Chicago";
const DAY_VIEW_LINK = 'a[href*="view=day"]';
const PAGE_TITLE = "Sterett Creek Village Trustee | Calendar";
const TEST_TITLE_AND_NAV = "renders title and navigation";
const TEST_PREV_NEXT_NAV = "renders previous and next navigation links";
const TEST_VIEW_SWITCHER = "renders view switcher tabs";

const now = DateTime.now().setZone(CHICAGO);
const today = now.toISODate() ?? now.toFormat("yyyy-MM-dd");
const currentYear = now.year;
const currentMonth = now.month;

test.describe("calendar Page — Month View", () => {
  test(TEST_TITLE_AND_NAV, async ({ page }) => {
    await page.goto("/calendar");

    await expect.soft(page).toHaveTitle(PAGE_TITLE);
    await expect.soft(page.getByRole("navigation")).toBeVisible();
  });

  test("renders current month heading", async ({ page }) => {
    await page.goto("/calendar");

    const monthName = now.toLocaleString(
      { month: "long" },
      { locale: "en-US" },
    );
    await expect
      .soft(page.getByRole("heading", { name: new RegExp(monthName, "iu") }))
      .toBeVisible();
  });

  test("renders day-of-week column headers", async ({ page }) => {
    await page.goto("/calendar");

    for (const day of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]) {
      // eslint-disable-next-line no-await-in-loop
      await expect.soft(page.getByText(day).first()).toBeVisible();
    }
  });

  test(TEST_PREV_NEXT_NAV, async ({ page }) => {
    await page.goto("/calendar");

    await expect.soft(page.getByRole("link", { name: /prev/iu })).toBeVisible();
    await expect.soft(page.getByRole("link", { name: /next/iu })).toBeVisible();
  });

  test("navigates to the next month and back", async ({ page }) => {
    await page.goto("/calendar");

    await page.getByRole("link", { name: /next/iu }).click();
    await expect.soft(page).toHaveURL(/[?&]view=month/u);

    await page.getByRole("link", { name: /prev/iu }).click();
    await expect.soft(page).toHaveURL(/[?&]view=month/u);
  });

  test("shows Today link when viewing a month other than the current month", async ({
    page,
  }) => {
    const nextMonth = now.plus({ months: 1 });
    await page.goto(
      `/calendar?view=month&year=${nextMonth.year}&month=${nextMonth.month}`,
    );

    await expect.soft(page.getByRole("link", { name: "Today" })).toBeVisible();
  });

  test("does not show Today link when viewing the current month", async ({
    page,
  }) => {
    await page.goto(
      `/calendar?view=month&year=${currentYear}&month=${currentMonth}`,
    );

    await expect.soft(page.getByRole("link", { name: "Today" })).toBeHidden();
  });

  test(TEST_VIEW_SWITCHER, async ({ page }) => {
    await page.goto("/calendar");

    await expect.soft(page.getByRole("link", { name: "Month" })).toBeVisible();
    await expect.soft(page.getByRole("link", { name: "Week" })).toBeVisible();
    await expect.soft(page.getByRole("link", { name: "Day" })).toBeVisible();
  });
});

test.describe("calendar Page — Week View", () => {
  test(TEST_TITLE_AND_NAV, async ({ page }) => {
    await page.goto(`/calendar?view=week&date=${today}`);

    await expect.soft(page).toHaveTitle(PAGE_TITLE);
    await expect.soft(page.getByRole("navigation")).toBeVisible();
  });

  test("renders week heading with date range", async ({ page }) => {
    await page.goto(`/calendar?view=week&date=${today}`);

    // Week heading format: "Jun 1 – Jun 7, 2025"
    await expect.soft(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test(TEST_PREV_NEXT_NAV, async ({ page }) => {
    await page.goto(`/calendar?view=week&date=${today}`);

    await expect.soft(page.getByRole("link", { name: /prev/iu })).toBeVisible();
    await expect.soft(page.getByRole("link", { name: /next/iu })).toBeVisible();
  });

  test("navigates to the next week and back", async ({ page }) => {
    await page.goto(`/calendar?view=week&date=${today}`);

    await page.getByRole("link", { name: /next/iu }).click();
    await expect.soft(page).toHaveURL(/view=week.*date=/u);

    await page.getByRole("link", { name: /prev/iu }).click();
    await expect.soft(page).toHaveURL(/view=week.*date=/u);
  });

  test("shows Today link when viewing a week that does not contain today", async ({
    page,
  }) => {
    const futureDate = now.plus({ weeks: 2 }).toISODate() ?? today;
    await page.goto(`/calendar?view=week&date=${futureDate}`);

    await expect.soft(page.getByRole("link", { name: "Today" })).toBeVisible();
  });

  test("does not show Today link when viewing the current week", async ({
    page,
  }) => {
    await page.goto(`/calendar?view=week&date=${today}`);

    await expect.soft(page.getByRole("link", { name: "Today" })).toBeHidden();
  });

  test(TEST_VIEW_SWITCHER, async ({ page }) => {
    await page.goto(`/calendar?view=week&date=${today}`);

    await expect.soft(page.getByRole("link", { name: "Month" })).toBeVisible();
    await expect.soft(page.getByRole("link", { name: "Week" })).toBeVisible();
    await expect.soft(page.getByRole("link", { name: "Day" })).toBeVisible();
  });

  test("renders links to day view for each day in the week", async ({
    page,
  }) => {
    await page.goto(`/calendar?view=week&date=${today}`);

    // Each day in the week view links to /calendar?view=day&date=...
    await expect.soft(page.locator(DAY_VIEW_LINK).first()).toBeVisible();
  });
});

test.describe("calendar Page — Day View", () => {
  test(TEST_TITLE_AND_NAV, async ({ page }) => {
    await page.goto(`/calendar?view=day&date=${today}`);

    await expect.soft(page).toHaveTitle(PAGE_TITLE);
    await expect.soft(page.getByRole("navigation")).toBeVisible();
  });

  test("renders full day heading with weekday and date", async ({ page }) => {
    await page.goto(`/calendar?view=day&date=${today}`);

    // Day heading format: "Sunday, March 22, 2026"
    await expect.soft(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test(TEST_PREV_NEXT_NAV, async ({ page }) => {
    await page.goto(`/calendar?view=day&date=${today}`);

    await expect.soft(page.getByRole("link", { name: /prev/iu })).toBeVisible();
    await expect.soft(page.getByRole("link", { name: /next/iu })).toBeVisible();
  });

  test("navigates to the next day and back", async ({ page }) => {
    await page.goto(`/calendar?view=day&date=${today}`);

    await page.getByRole("link", { name: /next/iu }).click();
    await expect.soft(page).toHaveURL(/view=day.*date=/u);

    await page.getByRole("link", { name: /prev/iu }).click();
    await expect.soft(page).toHaveURL(/view=day.*date=/u);
  });

  test("shows Today link when viewing a day other than today", async ({
    page,
  }) => {
    const yesterday = now.minus({ days: 1 }).toISODate() ?? today;
    await page.goto(`/calendar?view=day&date=${yesterday}`);

    await expect.soft(page.getByRole("link", { name: "Today" })).toBeVisible();
  });

  test("does not show Today link when viewing today", async ({ page }) => {
    await page.goto(`/calendar?view=day&date=${today}`);

    await expect.soft(page.getByRole("link", { name: "Today" })).toBeHidden();
  });

  test("renders empty state when no events are scheduled", async ({ page }) => {
    // Use a past date unlikely to have events
    await page.goto("/calendar?view=day&date=2000-01-01");

    await expect.soft(page.getByText("No events scheduled")).toBeVisible();
  });

  test(TEST_VIEW_SWITCHER, async ({ page }) => {
    await page.goto(`/calendar?view=day&date=${today}`);

    await expect.soft(page.getByRole("link", { name: "Month" })).toBeVisible();
    await expect.soft(page.getByRole("link", { name: "Week" })).toBeVisible();
    await expect.soft(page.getByRole("link", { name: "Day" })).toBeVisible();
  });
});

test.describe("calendar Page — View Switching", () => {
  test("switching from month to week lands on week containing the 1st", async ({
    page,
  }) => {
    await page.goto(
      `/calendar?view=month&year=${currentYear}&month=${currentMonth}`,
    );

    await page.getByRole("link", { name: "Week" }).click();
    await expect.soft(page).toHaveURL(/view=week/u);
  });

  test("switching from month to day lands on the 1st of that month", async ({
    page,
  }) => {
    await page.goto(
      `/calendar?view=month&year=${currentYear}&month=${currentMonth}`,
    );

    await page.getByRole("link", { name: "Day" }).click();
    await expect.soft(page).toHaveURL(/view=day/u);
  });

  test("switching from week to month preserves the month context", async ({
    page,
  }) => {
    await page.goto(`/calendar?view=week&date=${today}`);

    await page.getByRole("link", { name: "Month" }).click();
    await expect.soft(page).toHaveURL(/view=month/u);
  });

  test("switching from day to week preserves the date context", async ({
    page,
  }) => {
    await page.goto(`/calendar?view=day&date=${today}`);

    await page.getByRole("link", { name: "Week" }).click();
    await expect.soft(page).toHaveURL(/view=week/u);
  });

  test("switching from day to month preserves the month context", async ({
    page,
  }) => {
    await page.goto(`/calendar?view=day&date=${today}`);

    await page.getByRole("link", { name: "Month" }).click();
    await expect.soft(page).toHaveURL(/view=month/u);
  });
});
