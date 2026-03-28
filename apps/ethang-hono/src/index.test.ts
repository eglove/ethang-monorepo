import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("flowbite", () => ({}));
vi.mock("@ethang/toolbelt/http/cookie.js", () => ({
  getCookieValue: vi.fn().mockReturnValue(new Error("no cookie")),
}));
vi.mock("./models/blog-model.ts", () => ({
  BlogModel: vi.fn(),
}));
vi.mock("./clients/sanity.ts", () => ({
  sanityClient: { fetch: vi.fn() },
}));
vi.mock("./db/database.ts", () => ({
  getDatabase: vi.fn(),
}));
vi.mock("./stores/course-path-store.ts", () => {
  const mockStore = {
    courseTrackings: [],
    getCourse: vi.fn(),
    getCourseTracking: vi.fn(),
    getStatusPercentages: vi
      .fn()
      .mockReturnValue({ complete: 0, incomplete: 100, revisit: 0 }),
    latestUpdate: undefined,
    learningPaths: [],
    setup: vi.fn().mockResolvedValue(undefined),
    totalCourseCount: 0,
  };
  return {
    coursePathData: mockStore,
    CoursePathStore: vi.fn(),
  };
});

import { app } from "./index.tsx";
import { BlogModel } from "./models/blog-model.ts";

const CONTENT_TYPE = "Content-Type";
const RETURNS_200_HTML = "returns 200 with HTML";
const TEXT_HTML = "text/html";
const COURSES_URL = "https://ethang.dev/courses";

let mockGetAllBlogs = vi.fn();
let mockGetBlogBySlug = vi.fn();

describe("app — pages", () => {
  beforeEach(() => {
    mockGetAllBlogs = vi.fn();
    mockGetBlogBySlug = vi.fn();
    vi.mocked(BlogModel).mockImplementation(
      class {
        public getAllBlogs = mockGetAllBlogs;
        public getBlogBySlug = mockGetBlogBySlug;
      } as never,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("www redirect middleware", () => {
    it("redirects www.ethang.dev to ethang.dev", async () => {
      const response = await app.request("https://www.ethang.dev/");
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("https://ethang.dev/");
    });

    it("preserves pathname in redirect", async () => {
      const response = await app.request("https://www.ethang.dev/blog/my-post");
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe(
        "https://ethang.dev/blog/my-post",
      );
    });

    it("preserves query string in redirect", async () => {
      const response = await app.request(
        "https://www.ethang.dev/courses?format=text",
      );
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe(
        "https://ethang.dev/courses?format=text",
      );
    });
  });

  describe("GET /sitemap.xml", () => {
    beforeEach(() => {
      mockGetAllBlogs.mockResolvedValue([]);
    });

    it("returns XML content type", async () => {
      const response = await app.request("https://ethang.dev/sitemap.xml");
      expect(response.headers.get(CONTENT_TYPE)).toContain("application/xml");
    });

    it("returns 200 status", async () => {
      const response = await app.request("https://ethang.dev/sitemap.xml");
      expect(response.status).toBe(200);
    });
  });

  describe("GET /blogRss.xml", () => {
    beforeEach(() => {
      mockGetAllBlogs.mockResolvedValue([]);
    });

    it("returns XML content type", async () => {
      const response = await app.request("https://ethang.dev/blogRss.xml");
      expect(response.headers.get(CONTENT_TYPE)).toContain("text/xml");
    });

    it("returns 200 status", async () => {
      const response = await app.request("https://ethang.dev/blogRss.xml");
      expect(response.status).toBe(200);
    });
  });

  describe("GET / (home)", () => {
    it(RETURNS_200_HTML, async () => {
      const response = await app.request("https://ethang.dev/");
      expect(response.status).toBe(200);
      expect(response.headers.get(CONTENT_TYPE)).toContain(TEXT_HTML);
    });
  });

  describe("GET /sign-in", () => {
    it(RETURNS_200_HTML, async () => {
      const response = await app.request("https://ethang.dev/sign-in");
      expect(response.status).toBe(200);
      expect(response.headers.get(CONTENT_TYPE)).toContain(TEXT_HTML);
    });
  });

  describe("GET /tips", () => {
    it(RETURNS_200_HTML, async () => {
      const response = await app.request("https://ethang.dev/tips");
      expect(response.status).toBe(200);
    });
  });

  describe("GET /tips/scroll-containers", () => {
    it(RETURNS_200_HTML, async () => {
      const response = await app.request(
        "https://ethang.dev/tips/scroll-containers",
      );
      expect(response.status).toBe(200);
    });
  });

  describe("GET /tips/scrollbar-gutter", () => {
    it(RETURNS_200_HTML, async () => {
      const response = await app.request(
        "https://ethang.dev/tips/scrollbar-gutter",
      );
      expect(response.status).toBe(200);
    });
  });

  describe("GET /blog", () => {
    beforeEach(() => {
      mockGetAllBlogs.mockResolvedValue([]);
    });

    it(RETURNS_200_HTML, async () => {
      const response = await app.request("https://ethang.dev/blog");
      expect(response.status).toBe(200);
      expect(response.headers.get(CONTENT_TYPE)).toContain(TEXT_HTML);
    });
  });

  describe("GET /blog/:slug", () => {
    beforeEach(() => {
      mockGetBlogBySlug.mockResolvedValue({
        _createdAt: "2024-01-01T00:00:00Z",
        _id: "blog-1",
        _updatedAt: "2024-06-01T00:00:00Z",
        author: "Test Author",
        body: [],
        description: "A test blog post",
        featuredImage: { asset: { url: "https://example.com/image.jpg" } },
        slug: { current: "my-post" },
        title: "My Test Post",
      });
    });

    it(RETURNS_200_HTML, async () => {
      const response = await app.request("https://ethang.dev/blog/my-post");
      expect(response.status).toBe(200);
      expect(response.headers.get(CONTENT_TYPE)).toContain(TEXT_HTML);
    });
  });

  describe("not found", () => {
    it("returns HTML for unknown routes", async () => {
      const response = await app.request(
        "https://ethang.dev/this-does-not-exist",
      );
      expect(response.headers.get(CONTENT_TYPE)).toContain(TEXT_HTML);
    });
  });

  describe("GET /courses", () => {
    it(RETURNS_200_HTML, async () => {
      const response = await app.request(COURSES_URL);
      expect(response.status).toBe(200);
    });

    it("returns text/plain when format=text", async () => {
      const response = await app.request(`${COURSES_URL}?format=text`);
      expect(response.status).toBe(200);
      expect(response.headers.get(CONTENT_TYPE)).toContain("text/plain");
    });

    it("renders sign-in-prompt element for client-side auth reconciliation", async () => {
      const response = await app.request(COURSES_URL);
      const html = await response.text();
      expect(html).toContain('id="sign-in-prompt"');
    });

    it("renders auth-section-header element for client-side auth reconciliation", async () => {
      const response = await app.request(COURSES_URL);
      const html = await response.text();
      expect(html).toContain('id="auth-section-header"');
    });
  });
});
