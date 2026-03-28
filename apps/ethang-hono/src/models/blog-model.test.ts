import { faker } from "@faker-js/faker";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../clients/sanity.ts", () => ({
  sanityClient: {
    fetch: vi.fn(),
  },
}));

import type { Mock } from "vitest";

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

describe("BlogModel", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllBlogs", () => {
    it("fetches blogs from Sanity", async () => {
      const blogs = [makeBlog(), makeBlog()];
      (sanityClient.fetch as Mock).mockResolvedValue(blogs);

      const model = new BlogModel();
      const result = await model.getAllBlogs();

      expect(result).toEqual(blogs);
    });

    it("queries for blog type ordered by creation date descending", async () => {
      (sanityClient.fetch as Mock).mockResolvedValue([]);

      const model = new BlogModel();
      await model.getAllBlogs();

      const query = (sanityClient.fetch as Mock).mock.calls[0][0] as string;
      expect(query).toContain('*[_type == "blog"]');
      expect(query).toContain("_createdAt desc");
    });

    it("selects required blog fields", async () => {
      (sanityClient.fetch as Mock).mockResolvedValue([]);

      const model = new BlogModel();
      await model.getAllBlogs();

      const query = (sanityClient.fetch as Mock).mock.calls[0][0] as string;
      expect(query).toContain("_id");
      expect(query).toContain("title");
      expect(query).toContain("slug");
      expect(query).toContain("description");
      expect(query).toContain("_updatedAt");
    });

    it("returns an empty array when no blogs exist", async () => {
      (sanityClient.fetch as Mock).mockResolvedValue([]);

      const model = new BlogModel();
      const result = await model.getAllBlogs();

      expect(result).toEqual([]);
    });
  });

  describe("getBlogBySlug", () => {
    it("fetches a blog by slug from Sanity", async () => {
      const blog = makeBlog();
      (sanityClient.fetch as Mock).mockResolvedValue(blog);

      const model = new BlogModel();
      const result = await model.getBlogBySlug("my-post");

      expect(result).toEqual(blog);
    });

    it("passes slug as a query parameter", async () => {
      (sanityClient.fetch as Mock).mockResolvedValue(null);

      const model = new BlogModel();
      await model.getBlogBySlug("specific-slug");

      const [, parameters] = (sanityClient.fetch as Mock).mock.calls[0];
      expect(parameters).toEqual({ slug: "specific-slug" });
    });

    it("queries using slug.current parameter", async () => {
      (sanityClient.fetch as Mock).mockResolvedValue(null);

      const model = new BlogModel();
      await model.getBlogBySlug("my-slug");

      const query = (sanityClient.fetch as Mock).mock.calls[0][0] as string;
      expect(query).toContain("slug.current == $slug");
    });

    it("uses the blog schema to expand body content", async () => {
      (sanityClient.fetch as Mock).mockResolvedValue(null);

      const model = new BlogModel();
      await model.getBlogBySlug("any-slug");

      const query = (sanityClient.fetch as Mock).mock.calls[0][0] as string;
      expect(query).toContain("body");
      expect(query).toContain("videoEmbed");
    });
  });
});
