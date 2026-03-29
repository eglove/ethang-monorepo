import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

import { navigateToWebContent } from "../helpers/screen-reader-helpers.ts";

test.describe("404 page — screen reader (NVDA)", () => {
  test("announces 404 Not Found heading", async ({ nvda, page }) => {
    await page.goto("/this-route-does-not-exist", { waitUntil: "load" });
    await navigateToWebContent(nvda, page);

    await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
    expect(await nvda.lastSpokenPhrase()).toContain("404");
  });
});
