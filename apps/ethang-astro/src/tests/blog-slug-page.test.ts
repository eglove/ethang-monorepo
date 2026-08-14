import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";

const { fetchBlogPost, fetchBlogSlugs } = vi.hoisted(() => {
  return {
    fetchBlogPost: vi.fn(),
    fetchBlogSlugs: vi.fn(async () => {
      return ["alpha", "beta"];
    })
  };
});

vi.mock("../lib/blog.ts", () => {
  return { fetchBlogPost, fetchBlogSlugs };
});

vi.mock("astro:content", () => {
  return {
    render: vi.fn(async () => {
      return {
        Content: () => {
          return null;
        }
      };
    })
  };
});

import SlugPage from "../pages/blog/[slug].astro";

describe("blog slug page", () => {
  it("renders the fallback title and no-content message for a missing slug", async () => {
    fetchBlogPost.mockResolvedValue(null);
    const container = await AstroContainer.create();
    const html = await container.renderToString(SlugPage as never, {
      params: {}
    });

    expect(html).toContain("Blog Post");
    expect(html).toContain("No content available.");
  });

  it("renders the no-content fallback when the post is null", async () => {
    fetchBlogPost.mockResolvedValue(null);
    const container = await AstroContainer.create();
    const html = await container.renderToString(SlugPage as never, {
      params: { slug: "missing" }
    });

    expect(html).toContain("No content available.");
    expect(html).toContain("Blog Post");
  });
});
