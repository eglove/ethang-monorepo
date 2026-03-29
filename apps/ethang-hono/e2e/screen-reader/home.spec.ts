import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

import { navigateToWebContent } from "../helpers/screen-reader-helpers.ts";

test.describe("home page — screen reader (NVDA)", () => {
  test("announces main heading", async ({ nvda, page }) => {
    await page.goto("/", { waitUntil: "load" });
    await navigateToWebContent(nvda, page);

    await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
    const phrase = await nvda.lastSpokenPhrase();
    expect(phrase).toBeTruthy();
    expect(phrase.toLowerCase()).toContain("heading");
  });

  test("navigation links are announced with accessible names", async ({
    nvda,
    page,
  }) => {
    await page.goto("/", { waitUntil: "load" });
    await navigateToWebContent(nvda, page);

    const phrases: string[] = [];
    for (let index = 0; 10 > index; index++) {
      await nvda.press("Tab");
      phrases.push(await nvda.lastSpokenPhrase());
    }

    const hasLink = phrases.some((p) => p.toLowerCase().includes("link"));
    expect(hasLink).toBe(true);
  });
});
