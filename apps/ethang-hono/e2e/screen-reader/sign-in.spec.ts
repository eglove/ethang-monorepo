import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";

import { routes } from "../../routes.ts";

test.describe("sign-in page — screen reader (NVDA)", () => {
  test("announces page heading", async ({ page, nvda }) => {
    await page.goto(routes.signIn, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
    expect(await nvda.lastSpokenPhrase()).toContain("Sign In");
  });

  test("announces Email field label when focused", async ({ page, nvda }) => {
    await page.goto(routes.signIn, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    await nvda.press("Tab");
    expect(await nvda.lastSpokenPhrase()).toContain("Email");
  });

  test("announces Password field label when focused", async ({ page, nvda }) => {
    await page.goto(routes.signIn, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    await nvda.press("Tab");
    await nvda.press("Tab");
    expect(await nvda.lastSpokenPhrase()).toContain("Password");
  });

  test("announces Submit button when focused", async ({ page, nvda }) => {
    await page.goto(routes.signIn, { waitUntil: "load" });
    await nvda.navigateToWebContent();

    await nvda.press("Tab");
    await nvda.press("Tab");
    await nvda.press("Tab");
    expect(await nvda.lastSpokenPhrase()).toContain("Submit");
  });

  test("announces error message after failed submission", async ({ page, nvda }) => {
    await page.context().route("https://auth.ethang.dev/sign-up", async (route) =>
      route.fulfill({ status: 401 }),
    );

    await page.goto(routes.signIn, { waitUntil: "load" });
    await page.getByLabel("Email").fill("bad@example.com");
    await page.getByLabel("Password").fill("wrong");
    await page.getByRole("button", { name: "Submit" }).click();

    await page.locator("#sign-in-error").waitFor({ state: "visible" });

    await nvda.navigateToWebContent();
    let found = false;
    for (let i = 0; i < 10; i++) {
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
