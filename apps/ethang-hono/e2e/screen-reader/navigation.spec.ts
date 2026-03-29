import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

test.describe("navigation hamburger — screen reader (NVDA, mobile)", () => {
  test("announces Open main menu button and expanded state", async ({ page, nvda, isMobile }) => {
    test.skip(!isMobile, "Hamburger menu only appears on mobile viewports");

    await page.goto("/", { waitUntil: "load" });
    await nvda.navigateToWebContent();

    let found = false;
    for (let i = 0; i < 20; i++) {
      await nvda.press("Tab");
      const phrase = await nvda.lastSpokenPhrase();
      if (phrase.toLowerCase().includes("open main menu")) {
        found = true;

        await nvda.act();
        const expandedPhrase = await nvda.lastSpokenPhrase();
        expect(expandedPhrase.toLowerCase()).toContain("expanded");

        break;
      }
    }
    expect(found).toBe(true);
  });
});
