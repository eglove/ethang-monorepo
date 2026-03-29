import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

import { routes } from "../../routes.ts";
import { navigateToWebContent } from "../helpers/screen-reader-helpers.ts";

test.describe("tips page — screen reader (NVDA)", () => {
  test("announces Tips heading", async ({ nvda, page }) => {
    await page.goto(routes.tips, { waitUntil: "load" });
    await navigateToWebContent(nvda, page);

    await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
    const phrase = await nvda.lastSpokenPhrase();
    expect(phrase.toLowerCase()).toContain("tip");
  });

  test("tip links are announced with accessible names", async ({
    nvda,
    page,
  }) => {
    await page.goto(routes.tips, { waitUntil: "load" });
    await navigateToWebContent(nvda, page);

    let scrollContainersFound = false;
    let scrollbarGutterFound = false;

    for (let index = 0; 20 > index; index++) {
      await nvda.press("Tab");
      const phrase = await nvda.lastSpokenPhrase();
      if (phrase.toLowerCase().includes("sticky")) scrollContainersFound = true;
      if (phrase.toLowerCase().includes("scrollbar-gutter"))
        scrollbarGutterFound = true;
      if (scrollContainersFound && scrollbarGutterFound) break;
    }

    expect(scrollContainersFound).toBe(true);
    expect(scrollbarGutterFound).toBe(true);
  });
});
