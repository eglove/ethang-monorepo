import { expect, test } from "./fixtures.ts";

test.describe("Files Page", () => {
  test("renders title and navigation", async ({ page }) => {
    await page.goto("/files");

    await expect(page).toHaveTitle("Sterett Creek Village Trustee | Files");
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("renders heading", async ({ page }) => {
    await page.goto("/files");

    await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
  });

  test("renders file category tables", async ({ page }) => {
    await page.goto("/files");

    await expect(
      page.getByRole("heading", { name: "Covenants" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "General" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Meeting Minutes" }),
    ).toBeVisible();
  });
});
