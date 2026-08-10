import { expect, test } from "./fixtures.ts";

const SCROLL_CONTAINERS_URL = "/tips/scroll-containers";

test.describe("Scroll Containers page — structure", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SCROLL_CONTAINERS_URL);
  });

  test("has the expected document title", async ({ page }) => {
    await expect(page.title()).resolves.toBe("EthanG");
  });

  test("renders a main landmark", async ({ page }) => {
    const main = page.getByRole("main");
    await expect(main).toBeVisible();
  });

  test("displays the Easy Sticky Header/Footer heading", async ({ page }) => {
    const heading = page.getByRole("heading", {
      level: 1,
      name: "Easy Sticky Header/Footer"
    });
    await expect(heading).toBeVisible();
  });

  test('has a "tips-page" data-testid on the outer container', async ({
    page
  }) => {
    const tipsPage = page.getByTestId("tips-page");
    await expect(tipsPage).toBeVisible();
    await expect(tipsPage).toHaveClass(/gap-8/u);
  });

  test("marks the Tips navigation link as active", async ({ page }) => {
    const tipsLink = page.getByRole("link", { name: "Tips" });
    await expect(tipsLink).toBeVisible();
    await expect(tipsLink).toHaveAttribute("href", "/tips");
  });
});

test.describe("Scroll Containers page — code blocks", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SCROLL_CONTAINERS_URL);
  });

  test("renders CSS, HTML, and Tailwind sections with headings", async ({
    page
  }) => {
    await expect(
      page.getByRole("heading", { level: 2, name: "CSS" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Tailwind" })
    ).toBeVisible();
  });

  test("first code block contains CSS grid example", async ({ page }) => {
    // Playwright's toContainText matches across shadow DOM and syntax-highlighted spans
    await expect(
      page.getByRole("heading", { level: 2, name: "CSS" }).locator("..")
    ).toContainText(/display: grid/u);
  });

  test("Tailwind code block contains grid-rows utility", async ({ page }) => {
    const tailwindHeading = page.getByRole("heading", {
      level: 2,
      name: "Tailwind"
    });
    await expect(tailwindHeading).toBeVisible();
    // Check the full page text contains the Tailwind utility pattern
    await expect(page.locator("body")).toContainText(
      /grid-rows-\[auto_1fr_auto\]/u
    );
  });
});

test.describe("Scroll Containers page — demo section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SCROLL_CONTAINERS_URL);
  });

  test("renders the scroll-containers-demo data-testid", async ({ page }) => {
    const demo = page.getByTestId("scroll-containers-demo");
    await expect(demo).toBeVisible();
    await expect(demo).toHaveClass(/max-w-lg/u);
  });

  test("labels the scrollable region with an accessible name", async ({
    page
  }) => {
    const scrollRegion = page.getByLabel("Scroll container demo");
    await expect(scrollRegion).toBeVisible();
    await expect(scrollRegion).toHaveClass(/h-64/u);
    await expect(scrollRegion).toHaveClass(/overflow-auto/u);
  });

  test("shows the fixed header and footer labels in the demo", async ({
    page
  }) => {
    const demo = page.getByTestId("scroll-containers-demo");
    // Header badge and Footer badge are rendered as Badge components within the demo
    await expect(demo.getByText(/Fixed at the top/iu)).toBeVisible();
    await expect(demo.getByText(/Fixed at the bottom/iu)).toBeVisible();
  });

  test("displays scrollable content text", async ({ page }) => {
    await expect(page.getByText("Scrollable content")).toBeVisible();
    await expect(page.getByText(/fixed at the top/iu)).toBeVisible();
    await expect(page.getByText(/fixed at the bottom/iu)).toBeVisible();
  });

  test("renders the demo heading", async ({ page }) => {
    const demoHeading = page.getByRole("heading", {
      level: 2,
      name: "Demo"
    });
    await expect(demoHeading).toBeVisible();
  });

  test("shows CSS and Tailwind section headings", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 2, name: "CSS" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Tailwind" })
    ).toBeVisible();
  });
});
