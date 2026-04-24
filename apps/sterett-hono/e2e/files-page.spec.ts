import { expect, test } from "./fixtures.ts";
import { assertHeading, assertTitleAndNavigation } from "./test-utilities.ts";

test.describe("files Page", () => {
  test("renders all page elements", async ({ page }) => {
    await assertTitleAndNavigation(
      page,
      "/files",
      "Sterett Creek Village Trustee | Files",
    );
    await assertHeading(page, "Files");

    await expect
      .soft(page.getByRole("heading", { name: "Covenants" }))
      .toBeVisible();
    await expect
      .soft(page.getByRole("heading", { name: "General" }))
      .toBeVisible();
    await expect
      .soft(page.getByRole("heading", { name: "Meeting Minutes" }))
      .toBeVisible();
  });
});
