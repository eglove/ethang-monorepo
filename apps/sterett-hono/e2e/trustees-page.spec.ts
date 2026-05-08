import { expect, test } from "./fixtures.ts";
import { assertHeading, assertTitleAndNavigation } from "./test-utilities.ts";

const MAIN = "main";
const GRID = ".grid";

test.describe("trustees Page", () => {
  test("renders all page elements", async ({ page }) => {
    await assertTitleAndNavigation(
      page,
      "/trustees",
      "Sterett Creek Village Trustee | Trustees"
    );
    await assertHeading(page, "Trustees");

    await expect.soft(page.locator(MAIN)).toBeVisible();
    await expect.soft(page.locator(GRID)).toBeVisible();
  });
});
