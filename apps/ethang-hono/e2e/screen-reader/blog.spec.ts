import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

import { routes } from "../../routes.ts";

test.describe("blog listing page — screen reader (NVDA)", () => {
  test("announces Blog heading", async ({ nvda, page }) => {
    await page.goto(routes.blog, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
    expect(await nvda.lastSpokenPhrase()).toContain("Blog");
  });

  test("announces RSS Feed link", async ({ nvda, page }) => {
    await page.goto(routes.blog, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    let found = false;
    for (let index = 0; 20 > index; index++) {
      await nvda.press("Tab");
      const phrase = await nvda.lastSpokenPhrase();
      if (phrase.toLowerCase().includes("rss feed")) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});
