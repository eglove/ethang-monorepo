import { faker } from "@faker-js/faker";
import get from "lodash/get.js";
import { describe, expect, it, vi } from "vitest";

vi.mock(import("../clients/sanity.ts"), (() => ({
  sanityClient: {
    fetch: vi.fn(),
  },
})) as never);

import { sanityClient } from "../clients/sanity.ts";
import { BlogModel } from "./blog-model.ts";

const makeBlog = () => ({
  _createdAt: faker.date.past().toISOString(),
  _id: faker.string.uuid(),
  _updatedAt: faker.date.recent().toISOString(),
  author: faker.person.fullName(),
  blogCategory: { _id: faker.string.uuid(), title: faker.lorem.word() },
  description: faker.lorem.sentence(),
  slug: { current: faker.lorem.slug() },
  title: faker.lorem.words(3),
});

describe(BlogModel, () => {
  describe("getAllBlogs", () => {
    it("fetches blogs from Sanity", async () => {
      vi.clearAllMocks();
      const blogs = [makeBlog(), makeBlog()];
      vi.mocked(sanityClient).fetch.mockResolvedValue(blogs as never);

      const model = new BlogModel();
      const result = await model.getAllBlogs();

      expect(result).toStrictEqual(blogs);
    });

    it("queries for blog type ordered by creation date descending", async () => {
      vi.clearAllMocks();
      vi.mocked(sanityClient).fetch.mockResolvedValue([] as never);

      const model = new BlogModel();
      await model.getAllBlogs();

      const query = get(vi.mocked(sanityClient).fetch.mock.calls, "[0][0]");

      expect(query).toContain('*[_type == "blog"]');
      expect(query).toContain("_createdAt desc");
    });

    it("selects required blog fields", async () => {
      vi.clearAllMocks();
      vi.mocked(sanityClient).fetch.mockResolvedValue([] as never);

      const model = new BlogModel();
      await model.getAllBlogs();

      const query = get(vi.mocked(sanityClient).fetch.mock.calls, "[0][0]");

      expect(query).toContain("_id");
      expect(query).toContain("title");
      expect(query).toContain("slug");
      expect(query).toContain("description");
      expect(query).toContain("_updatedAt");
    });

    it("returns an empty array when no blogs exist", async () => {
      vi.clearAllMocks();
      vi.mocked(sanityClient).fetch.mockResolvedValue([] as never);

      const model = new BlogModel();
      const result = await model.getAllBlogs();

      expect(result).toStrictEqual([]);
    });
  });

  describe("getBlogBySlug", () => {
    it("fetches a blog by slug from Sanity", async () => {
      vi.clearAllMocks();
      const blog = makeBlog();
      vi.mocked(sanityClient).fetch.mockResolvedValue(blog as never);

      const model = new BlogModel();
      const result = await model.getBlogBySlug("my-post");

      expect(result).toStrictEqual(blog);
    });

    it("passes slug as a query parameter", async () => {
      vi.clearAllMocks();
      vi.mocked(sanityClient).fetch.mockResolvedValue(null as never);

      const model = new BlogModel();
      await model.getBlogBySlug("specific-slug");

      const parameters = get(
        vi.mocked(sanityClient).fetch.mock.calls,
        "[0][1]",
      );

      expect(parameters).toStrictEqual({ slug: "specific-slug" });
    });

    it("queries using slug.current parameter", async () => {
      vi.clearAllMocks();
      vi.mocked(sanityClient).fetch.mockResolvedValue(null as never);

      const model = new BlogModel();
      await model.getBlogBySlug("my-slug");

      const query = get(vi.mocked(sanityClient).fetch.mock.calls, "[0][0]");

      expect(query).toContain("slug.current == $slug");
    });

    it("uses the blog schema to expand body content", async () => {
      vi.clearAllMocks();
      vi.mocked(sanityClient).fetch.mockResolvedValue(null as never);

      const model = new BlogModel();
      await model.getBlogBySlug("any-slug");

      const query = get(vi.mocked(sanityClient).fetch.mock.calls, "[0][0]");

      expect(query).toContain("body");
      expect(query).toContain("videoEmbed");
    });
  });

  describe("getPaginatedBlogs", () => {
    const pageSize = 10;

    it("returns posts, total, and maxPages for page 1 with 25 total", async () => {
      vi.clearAllMocks();
      vi.mocked(sanityClient).fetch.mockResolvedValue([
        { posts: Array.from({ length: 10 }, () => makeBlog()) },
        { total: 25 },
      ] as never);

      const model = new BlogModel();
      const result = await model.getPaginatedBlogs(1, pageSize);

      expect(result.posts).toHaveLength(10);
      expect(result.total).toBe(25);
      expect(result.maxPages).toBe(3);
    });

    it("returns correct slice parameters for page 2", async () => {
      vi.clearAllMocks();
      vi.mocked(sanityClient).fetch.mockResolvedValue([
        { posts: Array.from({ length: 10 }, () => makeBlog()) },
        { total: 25 },
      ] as never);

      const model = new BlogModel();
      await model.getPaginatedBlogs(2, pageSize);

      const parameters = get(
        vi.mocked(sanityClient).fetch.mock.calls,
        "[0][1]",
      );

      expect(parameters).toMatchObject({ end: 20, start: 10 });
    });

    it("returns correct slice parameters for page 3", async () => {
      vi.clearAllMocks();
      vi.mocked(sanityClient).fetch.mockResolvedValue([
        { posts: Array.from({ length: 5 }, () => makeBlog()) },
        { total: 25 },
      ] as never);

      const model = new BlogModel();
      await model.getPaginatedBlogs(3, pageSize);

      const parameters = get(
        vi.mocked(sanityClient).fetch.mock.calls,
        "[0][1]",
      );

      expect(parameters).toMatchObject({ end: 30, start: 20 });
    });

    it("returns empty posts for out-of-range page", async () => {
      vi.clearAllMocks();
      vi.mocked(sanityClient).fetch.mockResolvedValue([
        { posts: [] },
        { total: 25 },
      ] as never);

      const model = new BlogModel();
      const result = await model.getPaginatedBlogs(4, pageSize);

      expect(result.posts).toHaveLength(0);
      expect(result.total).toBe(25);
      expect(result.maxPages).toBe(3);
    });

    it("returns maxPages=1 for zero total posts", async () => {
      vi.clearAllMocks();
      vi.mocked(sanityClient).fetch.mockResolvedValue([
        { posts: [] },
        { total: 0 },
      ] as never);

      const model = new BlogModel();
      const result = await model.getPaginatedBlogs(1, pageSize);

      expect(result.posts).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.maxPages).toBe(1);
    });

    it("returns maxPages=1 for 5 total posts with pageSize=10", async () => {
      vi.clearAllMocks();
      vi.mocked(sanityClient).fetch.mockResolvedValue([
        { posts: Array.from({ length: 5 }, () => makeBlog()) },
        { total: 5 },
      ] as never);

      const model = new BlogModel();
      const result = await model.getPaginatedBlogs(1, pageSize);

      expect(result.posts).toHaveLength(5);
      expect(result.total).toBe(5);
      expect(result.maxPages).toBe(1);
    });

    it("uses multi-query syntax", async () => {
      vi.clearAllMocks();
      vi.mocked(sanityClient).fetch.mockResolvedValue([
        { posts: [] },
        { total: 0 },
      ] as never);

      const model = new BlogModel();
      await model.getPaginatedBlogs(1, pageSize);

      const query = get(vi.mocked(sanityClient).fetch.mock.calls, "[0][0]");

      expect(query).toContain('"posts"');
      expect(query).toContain('"total"');
      expect(query).toContain("count(");
      expect(query).toContain("$start");
      expect(query).toContain("$end");
    });
  });
});
