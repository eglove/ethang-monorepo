import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

import { routes } from "../../routes.ts";
import { mockSignInError } from "../helpers/courses-auth-helpers.ts";
import { nvdaPress } from "../helpers/screen-reader-helpers.ts";

test.describe("sign-in page — screen reader (NVDA)", () => {
  test.describe("field navigation", () => {
    test.beforeEach(async ({ nvda, page }) => {
      await page.goto(routes.signIn, { waitUntil: "load" });
      await nvda.navigateToWebContent();
    });

    test("announces page heading", async ({ nvda }) => {
      await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
      expect(await nvda.lastSpokenPhrase()).toContain("Sign In");
    });

    test("announces Email field label when focused", async ({ nvda }) => {
      await nvda.press("Tab");
      expect(await nvda.lastSpokenPhrase()).toContain("Email");
    });

    test("announces Password field label when focused", async ({ nvda }) => {
      await nvdaPress(nvda, "Tab", 2);
      expect(await nvda.lastSpokenPhrase()).toContain("Password");
    });

    test("announces Submit button when focused", async ({ nvda }) => {
      await nvdaPress(nvda, "Tab", 3);
      expect(await nvda.lastSpokenPhrase()).toContain("Submit");
    });
  });

  test("announces error message after failed submission", async ({
    nvda,
    page,
  }) => {
    await mockSignInError(page);

    await page.goto(routes.signIn, { waitUntil: "load" });
    await page.getByLabel("Email").fill("bad@example.com");
    await page.getByLabel("Password").fill("wrong");
    await page.getByRole("button", { name: "Submit" }).click();

    await page.locator("#sign-in-error").waitFor({ state: "visible" });

    await nvda.navigateToWebContent();
    let found = false;
    for (let index = 0; 10 > index; index++) {
      await nvda.next();
      const phrase = await nvda.lastSpokenPhrase();
      if (phrase.includes("Failed to sign in")) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});
