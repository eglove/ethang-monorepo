import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

import { routes } from "../../routes.ts";

test.describe("scroll-containers page — screen reader (NVDA)", () => {
  test("announces Easy Sticky Header/Footer heading", async ({
    nvda,
    page,
  }) => {
    await page.goto(routes.scrollContainers, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
    expect(await nvda.lastSpokenPhrase()).toContain("Sticky");
  });

  test("announces CSS, Tailwind, and Demo section headings", async ({
    nvda,
    page,
  }) => {
    await page.goto(routes.scrollContainers, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    const headings: string[] = [];
    for (let index = 0; 5 > index; index++) {
      await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
      headings.push(await nvda.lastSpokenPhrase());
    }

    expect(headings.some((h) => h.includes("CSS"))).toBe(true);
    expect(headings.some((h) => h.includes("Tailwind"))).toBe(true);
    expect(headings.some((h) => h.includes("Demo"))).toBe(true);
  });
});
