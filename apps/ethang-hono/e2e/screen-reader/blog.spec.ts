import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

import { routes } from "../../routes.ts";

test.describe("blog listing page — screen reader (NVDA)", () => {
  test("announces Blog heading", async ({ page, nvda }) => {
    await page.goto(routes.blog, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
    expect(await nvda.lastSpokenPhrase()).toContain("Blog");
  });

  test("announces RSS Feed link", async ({ page, nvda }) => {
    await page.goto(routes.blog, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    let found = false;
    for (let i = 0; i < 20; i++) {
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
