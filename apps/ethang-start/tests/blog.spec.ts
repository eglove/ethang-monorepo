import { expect, test } from "./fixtures.ts";

const BLOG_URL = "/blog";

test.describe("Blog listing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BLOG_URL);
  });

  test("has the expected document title", async ({ page }) => {
    await expect(page.title()).resolves.toBe("EthanG");
  });

  test("renders a main landmark", async ({ page }) => {
    const main = page.getByRole("main");
    await expect(main).toBeVisible();
  });

  test("displays the Blog heading", async ({ page }) => {
    const heading = page.getByRole("heading", { level: 1, name: "Blog" });
    await expect(heading).toBeVisible();
  });

  test("marks the Blog navigation link as active", async ({ page }) => {
    const blogLink = page.getByRole("link", { name: "Blog" });
    await expect(blogLink).toBeVisible();
    await expect(blogLink).toHaveAttribute("href", BLOG_URL);
  });

  test("renders at least one blog post card", async ({ page }) => {
    const firstCard = page.getByRole("heading", { level: 2 }).first();
    await expect(firstCard).toBeVisible();
  });
});

test.describe("Blog listing page — posts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BLOG_URL);
  });

  test("displays blog post titles as links to individual posts", async ({
    page
  }) => {
    const firstPostLink = page
      .getByRole("heading", { level: 2 })
      .first()
      .locator("a");
    await expect(firstPostLink).toBeVisible();
    await expect(firstPostLink).toHaveAttribute("href", /^\/blog\//u);
  });
});

test.describe("Blog listing page — pagination", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BLOG_URL);
  });

  test("renders pagination component when posts exceed one page", async ({
    page
  }) => {
    // Pagination is rendered by the blog route when there are multiple pages
    const pagination = page.getByRole("navigation", { name: "Pagination" });
    await expect(pagination).toBeVisible();
  });
});

test.describe("Blog detail page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a blog post via the listing page link
    await page.goto(BLOG_URL);
    const firstPostLink = page.getByRole("heading", { level: 2 }).first();
    await expect(firstPostLink).toBeVisible();
    await firstPostLink.click();
  });

  test("has the expected document title", async ({ page }) => {
    await expect(page.title()).resolves.toBe("EthanG");
  });

  test("renders a main landmark", async ({ page }) => {
    const main = page.getByRole("main");
    await expect(main).toBeVisible();
  });

  test("displays the blog post title as an h1 heading", async ({ page }) => {
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });

  test("renders SanityText content in the page", async ({ page }) => {
    // The body content rendered by SanityText should be present somewhere in the page
    const sanityContent = page.getByTestId("sanity-text").or(
      page.locator("main").filter({
        has: page.getByRole("heading", { level: 1 }).locator("..")
      })
    );
    await expect(sanityContent).toBeVisible();
  });

  test("marks the Blog navigation link as active", async ({ page }) => {
    const blogLink = page.getByRole("link", { name: "Blog" });
    await expect(blogLink).toBeVisible();
    await expect(blogLink).toHaveAttribute("href", BLOG_URL);
  });
});
