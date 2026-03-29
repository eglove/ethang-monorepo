import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

import { routes } from "../../routes.ts";

test.describe("tips page — screen reader (NVDA)", () => {
  test("announces Tips heading", async ({ page, nvda }) => {
    await page.goto(routes.tips, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
    const phrase = await nvda.lastSpokenPhrase();
    expect(phrase.toLowerCase()).toContain("tip");
  });

  test("tip links are announced with accessible names", async ({ page, nvda }) => {
    await page.goto(routes.tips, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    let scrollContainersFound = false;
    let scrollbarGutterFound = false;

    for (let i = 0; i < 20; i++) {
      await nvda.press("Tab");
      const phrase = await nvda.lastSpokenPhrase();
      if (phrase.toLowerCase().includes("sticky")) scrollContainersFound = true;
      if (phrase.toLowerCase().includes("scrollbar-gutter")) scrollbarGutterFound = true;
      if (scrollContainersFound && scrollbarGutterFound) break;
    }

    expect(scrollContainersFound).toBe(true);
    expect(scrollbarGutterFound).toBe(true);
  });
});
