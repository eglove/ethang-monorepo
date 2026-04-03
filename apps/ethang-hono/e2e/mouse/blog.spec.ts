import get from "lodash/get.js";

import type { GetBlogs } from "../../src/models/get-blogs.ts";

import { routes } from "../../routes.ts";
import { sanityClient } from "../../src/clients/sanity.ts";
import { expect, test } from "../index.ts";

const blogs = await sanityClient.fetch<GetBlogs>(`*[_type == "blog"] { slug }`);

test.describe("blog pages", () => {
  test("blog listing page loads and passes a11y", async ({ axePage }) => {
    const response = await axePage.goto(routes.blog);
    expect.soft(response?.status()).toBe(200);
    await expect
      .soft(axePage.getByRole("heading", { name: "Blog" }))
      .toBeVisible();
    await expect
      .soft(axePage.getByRole("link", { name: "RSS Feed" }))
      .toBeVisible();
  });

  for (const blog of blogs) {
    const slug = get(blog, ["slug", "current"]);

    test(`blog post /${slug} loads and passes a11y`, async ({ axePage }) => {
      const response = await axePage.goto(`${routes.blog}/${slug}`);
      expect.soft(response?.status()).toBe(200);
    });
  }
});

test.describe("blog pagination", () => {
  test("GET /blog/page/1 redirects to /blog", async ({ page }) => {
    const response = await page.goto("/blog/page/1");
    expect(response?.status()).toBe(200);
    expect(response?.url()).toBe("https://ethang.dev/blog");
  });

  test("GET /blog/page/0 redirects to /blog", async ({ page }) => {
    const response = await page.goto("/blog/page/0");
    expect(response?.status()).toBe(200);
    expect(response?.url()).toBe("https://ethang.dev/blog");
  });

  test("GET /blog/page/-1 redirects to /blog", async ({ page }) => {
    const response = await page.goto("/blog/page/-1");
    expect(response?.status()).toBe(200);
    expect(response?.url()).toBe("https://ethang.dev/blog");
  });

  test("GET /blog/page/abc redirects to /blog", async ({ page }) => {
    const response = await page.goto("/blog/page/abc");
    expect(response?.status()).toBe(200);
    expect(response?.url()).toBe("https://ethang.dev/blog");
  });

  test("GET /blog/page/2.5 redirects to /blog", async ({ page }) => {
    const response = await page.goto("/blog/page/2.5");
    expect(response?.status()).toBe(200);
    expect(response?.url()).toBe("https://ethang.dev/blog");
  });

  test("GET /blog/page/9999 redirects to last valid page", async ({ page }) => {
    const response = await page.goto("/blog/page/9999");
    expect(response?.status()).toBe(200);
    expect(response?.url()).toMatch(/\/blog(\/page\/\d+)?$/);
  });

  test("pagination controls are visible when multiple pages exist", async ({
    page,
  }) => {
    await page.goto(routes.blog);
    await expect
      .soft(page.getByRole("navigation", { name: "Pagination" }))
      .toBeVisible();
  });

  test("current page has aria-current attribute", async ({ page }) => {
    await page.goto(routes.blog);
    await expect
      .soft(page.getByRole("link", { name: "1" }).first())
      .toHaveAttribute("aria-current", "page");
  });

  test("prev button has correct aria-label on page 2", async ({ page }) => {
    await page.goto("/blog/page/2");
    await expect
      .soft(page.getByRole("link", { name: "Previous page" }))
      .toBeVisible();
  });

  test("next button has correct aria-label on page 1", async ({ page }) => {
    await page.goto(routes.blog);
    const paginationNav = page.getByRole("navigation", { name: "Pagination" });
    if (await paginationNav.isVisible()) {
      await expect
        .soft(page.getByRole("link", { name: "Next page" }))
        .toBeVisible();
    }
  });

  test("sitemap does not contain paginated index URLs", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect.soft(response?.status()).toBe(200);
    const content = await page.content();
    expect(content).not.toContain("/blog/page/");
    expect(content).toContain("/blog/");
  });

  test("RSS feed contains all posts unchanged", async ({ page }) => {
    const response = await page.goto("/blogRss.xml");
    expect.soft(response?.status()).toBe(200);
    const content = await page.content();
    expect(content).toContain("<rss");
    expect(content).toContain("<channel>");
  });
});
