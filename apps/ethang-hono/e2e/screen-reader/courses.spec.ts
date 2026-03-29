import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

import { routes } from "../../routes.ts";
import {
  MOCK_TRACKED_URL,
  MOCK_USER_ID,
  mockTrackingApi,
  mockVerifyOk,
  setAuthCookie,
} from "../helpers/courses-auth-helpers.ts";

const COMPLETION_BUTTON = ".course-completion-button";

test.describe("courses page — screen reader (NVDA, unauthenticated)", () => {
  test("announces Recommended Courses heading", async ({ page, nvda }) => {
    await page.goto(routes.courses, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
    expect(await nvda.lastSpokenPhrase()).toContain("Recommended Courses");
  });

  test("announces sign-in link when unauthenticated", async ({ page, nvda }) => {
    await page.goto(routes.courses, { waitUntil: "networkidle" });
    await nvda.navigateToWebContent();

    let found = false;
    for (let i = 0; i < 30; i++) {
      await nvda.next();
      const phrase = await nvda.lastSpokenPhrase();
      if (phrase.includes("Sign In To Track Changes")) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});

test.describe("courses page — screen reader (NVDA, authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await mockVerifyOk(page);
    await mockTrackingApi(page, [
      {
        courseUrl: MOCK_TRACKED_URL,
        id: "t1",
        status: "Revisit",
        userId: MOCK_USER_ID,
      },
    ]);
    await setAuthCookie(page);
  });

  test("announces Your Progress heading when authenticated", async ({ page, nvda }) => {
    await page.goto(routes.courses, { waitUntil: "networkidle" });
    await nvda.navigateToWebContent();

    let found = false;
    for (let i = 0; i < 10; i++) {
      await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
      const phrase = await nvda.lastSpokenPhrase();
      if (phrase.includes("Your Progress")) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  test("announces completion button label when focused", async ({ page, nvda }) => {
    await page.goto(routes.courses, { waitUntil: "networkidle" });
    await nvda.navigateToWebContent();

    let found = false;
    for (let i = 0; i < 40; i++) {
      await nvda.press("Tab");
      const phrase = await nvda.lastSpokenPhrase();
      if (phrase.toLowerCase().includes("button")) {
        const firstButton = page.locator(COMPLETION_BUTTON).first();
        if (await firstButton.evaluate((el) => document.activeElement === el)) {
          found = true;
          break;
        }
      }
    }
    expect(found).toBe(true);
  });
});
