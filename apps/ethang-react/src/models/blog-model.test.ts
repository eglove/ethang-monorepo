import { describe, expect, it, vi } from "vitest";

import { getAllBlogs, getBlogBySlug, getPaginatedBlogs } from "./blog-model.ts";

const mockFetch = vi.fn();

vi.mock("../clients/sanity.ts", () => {
  return {
    sanityClient: {
      fetch: (...arguments_: unknown[]) => {
        return mockFetch(...arguments_);
      }
    }
  };
});

const MOCK_SLUG = "test-blog";
const MOCK_PAGE = 2;
const MOCK_PAGE_SIZE = 5;

describe("getAllBlogs", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("returns queryOptions with correct queryKey", () => {
    const options = getAllBlogs();
    expect(options.queryKey).toEqual(["getAllBlogs"]);
  });

  it("calls sanityClient.fetch with correct GROQ query in queryFn", async () => {
    const mockData = [
      {
        _createdAt: "2024-01-01",
        _id: "1",
        _updatedAt: "2024-01-02",
        author: "Author",
        blogCategory: {
          _createdAt: "2024-01-01",
          _id: "c1",
          _rev: "r1",
          _type: "blogCategory",
          _updatedAt: "2024-01-02",
          title: "Blog"
        },
        description: "A blog post",
        slug: { _type: "slug", current: "test-blog" },
        title: "Test Blog"
      }
    ];
    mockFetch.mockResolvedValue(mockData);

    const options = getAllBlogs();
    const result = await options.queryFn();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('*[_type == "blog"] | order(_createdAt desc)')
    );
    expect(result).toEqual(mockData);
  });
});

describe("getBlogBySlug", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("returns queryOptions with correct queryKey including slug", () => {
    const options = getBlogBySlug(MOCK_SLUG);
    expect(options.queryKey).toEqual(["getBlogBySlug", MOCK_SLUG]);
  });

  it("calls sanityClient.fetch with correct GROQ query and slug parameter", async () => {
    const mockData = {
      _createdAt: "2024-01-01",
      _id: "1",
      _rev: "r1",
      _system: { base: { id: "1", rev: "r1" } },
      _type: "blog",
      _updatedAt: "2024-01-02",
      author: "Author",
      blogCategory: { _ref: "c1", _type: "reference" },
      body: [],
      description: "A blog post",
      featuredImage: { alt: "Alt", asset: {} as Record<string, unknown> },
      publishedAt: "2024-01-01",
      slug: { _type: "slug", current: MOCK_SLUG },
      title: "Test Blog"
    };
    mockFetch.mockResolvedValue(mockData);

    const options = getBlogBySlug(MOCK_SLUG);
    const result = await options.queryFn();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('*[_type == "blog" && slug.current == $slug][0]'),
      { slug: MOCK_SLUG }
    );
    expect(result).toEqual(mockData);
  });
});

describe("getPaginatedBlogs", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("returns queryOptions with correct queryKey including page and pageSize", () => {
    const options = getPaginatedBlogs(MOCK_PAGE, MOCK_PAGE_SIZE);
    expect(options.queryKey).toEqual([
      "getPaginatedBlogs",
      MOCK_PAGE,
      MOCK_PAGE_SIZE
    ]);
  });

  it("calls sanityClient.fetch with correct GROQ query and pagination params", async () => {
    const mockResult: [
      { posts: Record<string, unknown>[] },
      { total: number }
    ] = [
      {
        posts: [
          {
            _createdAt: "2024-01-01",
            _id: "1",
            _updatedAt: "2024-01-02",
            author: "A",
            blogCategory: {
              _createdAt: "2024-01-01",
              _id: "c1",
              _rev: "r1",
              _type: "blogCategory",
              _updatedAt: "2024-01-02",
              title: "Blog"
            },
            description: "D",
            slug: { _type: "slug", current: "post-1" },
            title: "Post 1",
            title: "Post 1"
          }
        ]
      },
      { total: 1 }
    ];
    mockFetch.mockResolvedValue(mockResult);

    const options = getPaginatedBlogs(MOCK_PAGE, MOCK_PAGE_SIZE);
    const result = await options.queryFn();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        '*[_type == "blog"] | order(_createdAt desc)[$start...$end]'
      ),
      {
        end: (MOCK_PAGE - 1) * MOCK_PAGE_SIZE + MOCK_PAGE_SIZE,
        start: (MOCK_PAGE - 1) * MOCK_PAGE_SIZE
      }
    );
    expect(result).toEqual({
      maxPages: 1,
      posts: mockResult[0].posts,
      total: 1
    });
  });

  it("returns maxPages as 1 when total is 0", async () => {
    const mockResult: [{ posts: [] }, { total: number }] = [
      { posts: [] },
      { total: 0 }
    ];
    mockFetch.mockResolvedValue(mockResult);

    const options = getPaginatedBlogs(1, 10);
    const result = await options.queryFn();

    expect(result.maxPages).toBe(1);
  });
});
