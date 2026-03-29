import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

import { routes } from "../../routes.ts";
import { navigateToWebContent } from "../helpers/screen-reader-helpers.ts";

test.describe("scrollbar-gutter page — screen reader (NVDA)", () => {
  test("announces page heading", async ({ nvda, page }) => {
    await page.goto(routes.scrollbarGutter, { waitUntil: "load" });
    await navigateToWebContent(nvda, page);

    await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
    expect(await nvda.lastSpokenPhrase()).toContain("scrollbar-gutter");
  });

  test("announces Show extra content button", async ({ nvda, page }) => {
    await page.goto(routes.scrollbarGutter, { waitUntil: "load" });
    await navigateToWebContent(nvda, page);

    let found = false;
    for (let index = 0; 20 > index; index++) {
      await nvda.press("Tab");
      const phrase = await nvda.lastSpokenPhrase();
      if (
        phrase.toLowerCase().includes("show extra content") &&
        phrase.toLowerCase().includes("button")
      ) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  test("announces Hide extra content button after toggle", async ({
    nvda,
    page,
  }) => {
    await page.goto(routes.scrollbarGutter, { waitUntil: "load" });

    await page.getByRole("button", { name: "Show extra content" }).click();

    await navigateToWebContent(nvda, page);

    let found = false;
    for (let index = 0; 20 > index; index++) {
      await nvda.press("Tab");
      const phrase = await nvda.lastSpokenPhrase();
      if (
        phrase.toLowerCase().includes("hide extra content") &&
        phrase.toLowerCase().includes("button")
      ) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});
