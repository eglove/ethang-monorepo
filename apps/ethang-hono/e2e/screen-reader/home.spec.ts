import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

test.describe("home page — screen reader (NVDA)", () => {
  test("announces main heading", async ({ page, nvda }) => {
    await page.goto("/", { waitUntil: "load" });
    await nvda.navigateToWebContent();

    await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
    const phrase = await nvda.lastSpokenPhrase();
    expect(phrase).toBeTruthy();
    expect(phrase.toLowerCase()).toContain("heading");
  });

  test("navigation links are announced with accessible names", async ({ page, nvda }) => {
    await page.goto("/", { waitUntil: "load" });
    await nvda.navigateToWebContent();

    const phrases: string[] = [];
    for (let i = 0; i < 10; i++) {
      await nvda.press("Tab");
      phrases.push(await nvda.lastSpokenPhrase());
    }

    const hasLink = phrases.some((p) => p.toLowerCase().includes("link"));
    expect(hasLink).toBe(true);
  });
});
