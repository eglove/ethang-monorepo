import { experimental_AstroContainer as AstroContainer } from "astro/container";
import constant from "lodash/constant.js";
import { describe, expect, it, vi } from "vitest";

const { fetchBlogMaxPages, fetchBlogPage } = vi.hoisted(() => {
  return {
    fetchBlogMaxPages: vi.fn(),
    fetchBlogPage: vi.fn()
  };
});

vi.mock("../lib/blog.ts", () => {
  return {
    fetchBlogMaxPages,
    fetchBlogPage,
    toPageHref: constant("")
  };
});

import BlogPage from "../pages/blog/page/[page].astro";

fetchBlogMaxPages.mockResolvedValue(1);
fetchBlogPage.mockResolvedValue({ maxPages: 1, posts: [], total: 0 });

describe("blog pagination page", () => {
  it("falls back to page 1 when the page param is not a number", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BlogPage as never, {
      params: { page: "not-a-number" }
    });

    expect(fetchBlogPage).toHaveBeenCalledWith(1);
    expect(html).toContain("Blog");
  });

  it("uses the numeric page parameter when valid", async () => {
    fetchBlogPage.mockResolvedValue({ maxPages: 1, posts: [], total: 0 });
    const container = await AstroContainer.create();
    const html = await container.renderToString(BlogPage as never, {
      params: { page: "3" }
    });

    expect(fetchBlogPage).toHaveBeenCalledWith(3);
    expect(html).toContain("Blog");
  });
});
