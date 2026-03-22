import { expect, test } from "./fixtures.ts";

test.describe("Calendar Page", () => {
  test("renders title and navigation", async ({ page }) => {
    await page.goto("/calendar");

    await expect(page).toHaveTitle("Sterett Creek Village Trustee | Calendar");
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("renders current month heading", async ({ page }) => {
    await page.goto("/calendar");

    const now = new Date();
    const monthYear = now.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    await expect(page.getByText(monthYear)).toBeVisible();
  });

  test("renders day-of-week headers", async ({ page }) => {
    await page.goto("/calendar");

    for (const day of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]) {
      // eslint-disable-next-line no-await-in-loop
      await expect(page.getByText(day)).toBeVisible();
    }
  });

  test("renders previous and next month navigation", async ({ page }) => {
    await page.goto("/calendar");

    await expect(page.getByRole("link", { name: /prev/iu })).toBeVisible();
    await expect(page.getByRole("link", { name: /next/iu })).toBeVisible();
  });

  test("navigates to previous and next month", async ({ page }) => {
    await page.goto("/calendar");

    await page.getByRole("link", { name: /next/iu }).click();
    await expect(page).toHaveURL(/year=\d+&month=\d+/u);

    await page.getByRole("link", { name: /prev/iu }).click();
    await expect(page).toHaveURL(/year=\d+&month=\d+/u);
  });
});
