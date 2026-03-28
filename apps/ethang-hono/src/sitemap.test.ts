import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./models/blog-model.ts", () => ({
  BlogModel: vi.fn(),
}));

import { DateTime } from "luxon";

import { BlogModel } from "./models/blog-model.ts";
import { sitemap } from "./sitemap.ts";

const makeBlog = (overrides = {}) => ({
  _id: faker.string.uuid(),
  _updatedAt: faker.date.recent().toISOString(),
  slug: { current: faker.lorem.slug() },
  ...overrides,
});

describe("sitemap", () => {
  let mockGetAllBlogs: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGetAllBlogs = vi.fn();
    vi.mocked(BlogModel).mockImplementation(
      class {
        getAllBlogs = mockGetAllBlogs;
      } as never,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns valid XML sitemap structure", async () => {
    mockGetAllBlogs.mockResolvedValue([]);

    const result = await sitemap();

    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(result).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
    expect(result).toContain("</urlset>");
  });

  it("includes all static routes", async () => {
    mockGetAllBlogs.mockResolvedValue([]);

    const result = await sitemap();

    expect(result).toContain("https://ethang.dev/blog");
    expect(result).toContain("https://ethang.dev/courses");
    expect(result).toContain("https://ethang.dev/tips");
    expect(result).toContain("https://ethang.dev/tips/scroll-containers");
    expect(result).toContain("https://ethang.dev/tips/scrollbar-gutter");
  });

  it("includes today's date as lastmod for static routes", async () => {
    mockGetAllBlogs.mockResolvedValue([]);

    const result = await sitemap();
    const today = DateTime.now().toFormat("yyyy-MM-dd");

    expect(result).toContain(`<lastmod>${today}</lastmod>`);
  });

  it("includes blog entries with their slugs", async () => {
    const blog = makeBlog({ slug: { current: "my-great-post" } });
    mockGetAllBlogs.mockResolvedValue([blog]);

    const result = await sitemap();

    expect(result).toContain("https://ethang.dev/blog/my-great-post");
  });

  it("formats blog lastmod as yyyy-MM-dd from _updatedAt", async () => {
    const updatedAt = "2024-09-25T16:45:00.000Z";
    const blog = makeBlog({ _updatedAt: updatedAt });
    mockGetAllBlogs.mockResolvedValue([blog]);

    const result = await sitemap();

    expect(result).toContain("2024-09-25");
  });

  it("includes an entry for each blog", async () => {
    const blogs = [makeBlog(), makeBlog(), makeBlog()];
    mockGetAllBlogs.mockResolvedValue(blogs);

    const result = await sitemap();
    const locCount = (result.match(/<loc>/gu) ?? []).length;

    // 5 static routes + 3 blogs
    expect(locCount).toBe(8);
  });

  it("generates valid URLs for blog entries", async () => {
    const blog = makeBlog({ slug: { current: "clean-code" } });
    mockGetAllBlogs.mockResolvedValue([blog]);

    const result = await sitemap();

    expect(result).toContain("<loc>https://ethang.dev/blog/clean-code</loc>");
  });
});
