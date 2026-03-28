import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../models/blog-model.ts", () => ({
  BlogModel: vi.fn(),
}));

import { BlogModel } from "../models/blog-model.ts";
import { blogRss } from "./blog-rss.ts";

const makeBlog = (overrides = {}) => ({
  _createdAt: faker.date.past().toISOString(),
  _id: faker.string.uuid(),
  _updatedAt: faker.date.recent().toISOString(),
  description: faker.lorem.sentence(),
  slug: { current: faker.lorem.slug() },
  title: faker.lorem.words(3),
  ...overrides,
});

describe("blogRss", () => {
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

  it("returns valid RSS XML structure", async () => {
    mockGetAllBlogs.mockResolvedValue([]);

    const result = await blogRss();

    expect(result).toContain('<?xml version="1.0" encoding="UTF-8" ?>');
    expect(result).toContain('<rss version="2.0"');
    expect(result).toContain("</rss>");
    expect(result).toContain("<channel>");
    expect(result).toContain("</channel>");
  });

  it("includes feed metadata", async () => {
    mockGetAllBlogs.mockResolvedValue([]);

    const result = await blogRss();

    expect(result).toContain("<title>EthanG | Blog</title>");
    expect(result).toContain("<link>https://ethang.dev/blog</link>");
    expect(result).toContain("<language>en-US</language>");
    expect(result).toContain("blogRss.xml");
  });

  it("uses current date for lastBuildDate when blogs list is empty", async () => {
    mockGetAllBlogs.mockResolvedValue([]);

    const before = new Date();
    const result = await blogRss();
    const after = new Date();

    const match = /<lastBuildDate>(.+?)<\/lastBuildDate>/u.exec(result);
    expect(match).not.toBeNull();

    const parsedDate = new Date(match![1]);
    expect(parsedDate.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
    expect(parsedDate.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
  });

  it("uses last blog _updatedAt for lastBuildDate", async () => {
    const updatedAt = "2024-07-15T09:30:00.000Z";
    const blogs = [
      makeBlog({ _updatedAt: "2024-01-01T00:00:00Z" }),
      makeBlog({ _updatedAt: updatedAt }),
    ];
    mockGetAllBlogs.mockResolvedValue(blogs);

    const result = await blogRss();

    expect(result).toContain(new Date(updatedAt).toUTCString());
  });

  it("includes an item for each blog", async () => {
    const blogs = [makeBlog(), makeBlog(), makeBlog()];
    mockGetAllBlogs.mockResolvedValue(blogs);

    const result = await blogRss();
    const itemCount = (result.match(/<item>/gu) ?? []).length;

    expect(itemCount).toBe(3);
  });

  it("includes blog title, link, description, and guid in each item", async () => {
    const blog = makeBlog({
      _id: "unique-guid-123",
      description: "A great post about testing",
      slug: { current: "testing-tips" },
      title: "Testing Tips",
    });
    mockGetAllBlogs.mockResolvedValue([blog]);

    const result = await blogRss();

    expect(result).toContain("<title>Testing Tips</title>");
    expect(result).toContain("https://ethang.dev/blog/testing-tips");
    expect(result).toContain("A great post about testing");
    expect(result).toContain("unique-guid-123");
  });

  it("formats pubDate as UTC string from _createdAt", async () => {
    const createdAt = "2024-03-01T14:00:00.000Z";
    const blog = makeBlog({ _createdAt: createdAt });
    mockGetAllBlogs.mockResolvedValue([blog]);

    const result = await blogRss();

    expect(result).toContain(new Date(createdAt).toUTCString());
  });
});
