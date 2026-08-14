/* eslint-disable @ethang/prefer-effect-datetime */
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { DateTime } from "effect";
import { describe, expect, it } from "vitest";

import BlogList from "./BlogList.astro";

const render = async (properties: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(BlogList, { props: properties });
};

const post = (overrides: Record<string, unknown> = {}) => {
  return {
    data: { slug: "s", title: "T", ...overrides }
  };
};

describe("BlogList", () => {
  it("shows the empty state when there are no posts", async () => {
    const html = await render({ maxPages: 1, page: 1, posts: [] });

    expect(html).toContain("No blog posts found.");
  });

  it("renders each post title and links to its slug", async () => {
    const html = await render({
      maxPages: 1,
      page: 1,
      posts: [
        post({ slug: "alpha", title: "Alpha" }),
        post({ slug: "beta", title: "Beta" })
      ]
    });

    expect(html).toContain("Alpha");
    expect(html).toContain('href="/blog/alpha"');
    expect(html).toContain("Beta");
  });

  it("shows the category kicker when a post has a category", async () => {
    const html = await render({
      maxPages: 1,
      page: 1,
      posts: [post({ blogCategory: "tech", title: "X" })]
    });

    expect(html).toContain("section-kicker");
    expect(html).toContain("tech");
  });

  it("omits the category kicker when no category is present", async () => {
    const html = await render({
      maxPages: 1,
      page: 1,
      posts: [post({ title: "X" })]
    });

    expect(html).not.toContain("section-kicker");
  });

  it("shows the updated date when present", async () => {
    const html = await render({
      maxPages: 1,
      page: 1,
      posts: [
        post({
          title: "X",
          updatedDate: DateTime.unsafeMake(new Date(2024, 0, 1))
        })
      ]
    });

    expect(html).toContain("Updated");
  });

  it("omits the updated date when absent", async () => {
    const html = await render({
      maxPages: 1,
      page: 1,
      posts: [post({ title: "X" })]
    });

    expect(html).not.toContain("Updated");
  });

  it("renders pagination when there is more than one page", async () => {
    const html = await render({
      maxPages: 2,
      page: 1,
      posts: [post({ title: "X" })]
    });

    expect(html).toContain('aria-label="Blog pagination"');
  });
});
