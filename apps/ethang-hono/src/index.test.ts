import { describe, expect, it, vi } from "vitest";

vi.mock(import("@ethang/toolbelt/http/cookie.js"), () => ({
  getCookieValue: vi.fn().mockReturnValue(new Error("no cookie")),
}));
vi.mock(import("./models/blog-model.ts"), () => ({
  BlogModel: vi.fn(),
}));
vi.mock(import("./clients/sanity.ts"), (() => ({
  sanityClient: { fetch: vi.fn() },
})) as never);
vi.mock(import("./db/database.ts"), () => ({
  getDatabase: vi.fn(),
}));
vi.mock(import("./stores/course-path-store.ts"), () => {
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

const BASE_URL = "https://ethang.dev/";
const CONTENT_TYPE = "Content-Type";
const COURSES_URL = "https://ethang.dev/courses";
const RETURNS_200_HTML = "returns 200 with HTML";
const TEXT_HTML = "text/html";

const mockBlogModelWith = (
  getPaginatedBlogs: ReturnType<typeof vi.fn>,
  getBlogBySlug: ReturnType<typeof vi.fn> = vi.fn(),
  getAllBlogs: ReturnType<typeof vi.fn> = vi.fn(),
) => {
  vi.mocked(BlogModel).mockImplementation(
    class {
      public getAllBlogs = getAllBlogs;
      public getPaginatedBlogs = getPaginatedBlogs;
      public getBlogBySlug = getBlogBySlug;
    } as never,
  );
};

describe("app — www redirect", () => {
  it("redirects www.ethang.dev to ethang.dev", async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn(), vi.fn());
    const response = await app.request("https://www.ethang.dev/");

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(BASE_URL);
  });

  it("preserves pathname in redirect", async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn(), vi.fn());
    const response = await app.request("https://www.ethang.dev/blog/my-post");

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "https://ethang.dev/blog/my-post",
    );
  });

  it("preserves query string in redirect", async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn(), vi.fn());
    const response = await app.request(
      "https://www.ethang.dev/courses?format=text",
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "https://ethang.dev/courses?format=text",
    );
  });
});

describe("app — feeds", () => {
  it("sitemap returns XML content type", async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn(), vi.fn(), vi.fn().mockResolvedValue([]));
    const response = await app.request("https://ethang.dev/sitemap.xml");

    expect(response.headers.get(CONTENT_TYPE)).toContain("application/xml");
  });

  it("sitemap returns 200 status", async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn(), vi.fn(), vi.fn().mockResolvedValue([]));
    const response = await app.request("https://ethang.dev/sitemap.xml");

    expect(response.status).toBe(200);
  });

  it("blogRss returns XML content type", async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn(), vi.fn(), vi.fn().mockResolvedValue([]));
    const response = await app.request("https://ethang.dev/blogRss.xml");

    expect(response.headers.get(CONTENT_TYPE)).toContain("text/xml");
  });

  it("blogRss returns 200 status", async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn(), vi.fn(), vi.fn().mockResolvedValue([]));
    const response = await app.request("https://ethang.dev/blogRss.xml");

    expect(response.status).toBe(200);
  });
});

describe("app — static pages", () => {
  it(`home ${RETURNS_200_HTML}`, async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn(), vi.fn());
    const response = await app.request(BASE_URL);

    expect(response.status).toBe(200);
    expect(response.headers.get(CONTENT_TYPE)).toContain(TEXT_HTML);
  });

  it(`sign-in ${RETURNS_200_HTML}`, async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn(), vi.fn());
    const response = await app.request("https://ethang.dev/sign-in");

    expect(response.status).toBe(200);
    expect(response.headers.get(CONTENT_TYPE)).toContain(TEXT_HTML);
  });

  it(`tips ${RETURNS_200_HTML}`, async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn(), vi.fn());
    const response = await app.request("https://ethang.dev/tips");

    expect(response.status).toBe(200);
  });

  it(`tips/scroll-containers ${RETURNS_200_HTML}`, async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn(), vi.fn());
    const response = await app.request(
      "https://ethang.dev/tips/scroll-containers",
    );

    expect(response.status).toBe(200);
  });

  it(`tips/scrollbar-gutter ${RETURNS_200_HTML}`, async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn(), vi.fn());
    const response = await app.request(
      "https://ethang.dev/tips/scrollbar-gutter",
    );

    expect(response.status).toBe(200);
  });

  it("not found returns HTML for unknown routes", async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn(), vi.fn());
    const response = await app.request(
      "https://ethang.dev/this-does-not-exist",
    );

    expect(response.headers.get(CONTENT_TYPE)).toContain(TEXT_HTML);
  });
});

describe("app — blog pages", () => {
  it(RETURNS_200_HTML, async () => {
    vi.clearAllMocks();
    mockBlogModelWith(
      vi.fn().mockResolvedValue({ maxPages: 1, posts: [], total: 0 }),
      vi.fn(),
    );
    const response = await app.request("https://ethang.dev/blog");

    expect(response.status).toBe(200);
    expect(response.headers.get(CONTENT_TYPE)).toContain(TEXT_HTML);
  });

  it(`blog/:slug ${RETURNS_200_HTML}`, async () => {
    vi.clearAllMocks();
    mockBlogModelWith(
      vi.fn(),
      vi.fn().mockResolvedValue({
        _createdAt: "2024-01-01T00:00:00Z",
        _id: "blog-1",
        _updatedAt: "2024-06-01T00:00:00Z",
        author: "Test Author",
        body: [],
        description: "A test blog post",
        featuredImage: { asset: { url: "https://example.com/image.jpg" } },
        slug: { current: "my-post" },
        title: "My Test Post",
      }),
    );
    const response = await app.request("https://ethang.dev/blog/my-post");

    expect(response.status).toBe(200);
    expect(response.headers.get(CONTENT_TYPE)).toContain(TEXT_HTML);
  });
});

describe("app — script loading", () => {
  it("inlines script manifest JSON in head", async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn(), vi.fn());
    const response = await app.request(BASE_URL);
    const html = await response.text();

    expect(html).toContain('id="script-manifest"');
  });

  it("loads loader script with defer", async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn(), vi.fn());
    const response = await app.request(BASE_URL);
    const html = await response.text();

    expect(html).toContain('src="/scripts/loader.js"');
    expect(html).toContain("defer");
  });

  it("does not emit individual module script tags for registered scripts", async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn(), vi.fn());
    const response = await app.request(BASE_URL);
    const html = await response.text();

    expect(html).not.toContain(
      'src="/scripts/components/navigation/navigation.client.js"',
    );
  });
});

describe("app — courses page", () => {
  it(RETURNS_200_HTML, async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn(), vi.fn());
    const response = await app.request(COURSES_URL);

    expect(response.status).toBe(200);
  });

  it("returns text/plain when format=text", async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn(), vi.fn());
    const response = await app.request(`${COURSES_URL}?format=text`);

    expect(response.status).toBe(200);
    expect(response.headers.get(CONTENT_TYPE)).toContain("text/plain");
  });

  it("renders sign-in-prompt element for client-side auth reconciliation", async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn(), vi.fn());
    const response = await app.request(COURSES_URL);
    const html = await response.text();

    expect(html).toContain('id="sign-in-prompt"');
  });

  it("renders auth-section-header element for client-side auth reconciliation", async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn(), vi.fn());
    const response = await app.request(COURSES_URL);
    const html = await response.text();

    expect(html).toContain('id="auth-section-header"');
  });
});
