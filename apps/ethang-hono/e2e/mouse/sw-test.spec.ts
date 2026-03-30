import { expect, test } from "@playwright/test";

test.describe("sw", () => {
  test("put is intercepted when SW blocked", async ({ browser }) => {
    const context = await browser.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();

    let routeHit = false;
    await page.route(/\/api\/course-tracking\/.*\//u, async (route) => {
      routeHit = true;
      await route.fulfill({
        body: JSON.stringify({ data: { status: "Complete" }, status: 200 }),
        contentType: "application/json",
        status: 200,
      });
    });

    await page.goto("http://localhost:8787");
    await page.evaluate(async () =>
      fetch("/api/course-tracking/test-user/abc123", {
        body: JSON.stringify({}),
        method: "PUT",
      }),
    );
    await page.waitForLoadState("load");

    expect.soft(routeHit).toBe(true);
    await context.close();
  });
});
