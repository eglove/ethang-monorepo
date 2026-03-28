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
    CoursePathStore: vi.fn(),
    coursePathData: mockStore,
  };
});

import type { Mock } from "vitest";

import { sanityClient } from "./clients/sanity.ts";
import { getDatabase } from "./db/database.ts";
import { BlogModel } from "./models/blog-model.ts";
import { COURSE_TRACKING_STATUS } from "./utilities/constants.ts";
import { app } from "./index.tsx";

const makeMockDb = () => {
  const mockFindFirst = vi.fn();
  const mockFindMany = vi.fn().mockResolvedValue([]);
  const mockValues = vi.fn().mockResolvedValue(undefined);
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
  const mockWhere = vi.fn().mockResolvedValue(undefined);
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

  return {
    _findFirst: mockFindFirst,
    _findMany: mockFindMany,
    _set: mockSet,
    _values: mockValues,
    _where: mockWhere,
    insert: mockInsert,
    query: {
      courseTrackingTable: {
        findFirst: mockFindFirst,
        findMany: mockFindMany,
      },
    },
    update: mockUpdate,
  };
};

describe("app", () => {
  describe("www redirect middleware", () => {
    it("redirects www.ethang.dev to ethang.dev", async () => {
      const res = await app.request("https://www.ethang.dev/");
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("https://ethang.dev/");
    });

    it("preserves pathname in redirect", async () => {
      const res = await app.request("https://www.ethang.dev/blog/my-post");
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe(
        "https://ethang.dev/blog/my-post",
      );
    });

    it("preserves query string in redirect", async () => {
      const res = await app.request(
        "https://www.ethang.dev/courses?format=text",
      );
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe(
        "https://ethang.dev/courses?format=text",
      );
    });
  });

  describe("GET /sitemap.xml", () => {
    beforeEach(() => {
      (BlogModel as Mock).mockImplementation(
        class {
          getAllBlogs = vi.fn().mockResolvedValue([]);
        } as never,
      );
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("returns XML content type", async () => {
      const res = await app.request("https://ethang.dev/sitemap.xml");
      expect(res.headers.get("Content-Type")).toContain("application/xml");
    });

    it("returns 200 status", async () => {
      const res = await app.request("https://ethang.dev/sitemap.xml");
      expect(res.status).toBe(200);
    });
  });

  describe("GET /blogRss.xml", () => {
    beforeEach(() => {
      (BlogModel as Mock).mockImplementation(
        class {
          getAllBlogs = vi.fn().mockResolvedValue([]);
        } as never,
      );
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("returns XML content type", async () => {
      const res = await app.request("https://ethang.dev/blogRss.xml");
      expect(res.headers.get("Content-Type")).toContain("text/xml");
    });

    it("returns 200 status", async () => {
      const res = await app.request("https://ethang.dev/blogRss.xml");
      expect(res.status).toBe(200);
    });
  });

  describe("GET / (home)", () => {
    it("returns 200 with HTML", async () => {
      const res = await app.request("https://ethang.dev/");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/html");
    });
  });

  describe("GET /sign-in", () => {
    it("returns 200 with HTML", async () => {
      const res = await app.request("https://ethang.dev/sign-in");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/html");
    });
  });

  describe("GET /tips", () => {
    it("returns 200 with HTML", async () => {
      const res = await app.request("https://ethang.dev/tips");
      expect(res.status).toBe(200);
    });
  });

  describe("GET /tips/scroll-containers", () => {
    it("returns 200 with HTML", async () => {
      const res = await app.request(
        "https://ethang.dev/tips/scroll-containers",
      );
      expect(res.status).toBe(200);
    });
  });

  describe("GET /tips/scrollbar-gutter", () => {
    it("returns 200 with HTML", async () => {
      const res = await app.request(
        "https://ethang.dev/tips/scrollbar-gutter",
      );
      expect(res.status).toBe(200);
    });
  });

  describe("GET /blog", () => {
    beforeEach(() => {
      (BlogModel as Mock).mockImplementation(
        class {
          getAllBlogs = vi.fn().mockResolvedValue([]);
        } as never,
      );
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("returns 200 with HTML", async () => {
      const res = await app.request("https://ethang.dev/blog");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/html");
    });
  });

  describe("GET /blog/:slug", () => {
    beforeEach(() => {
      (BlogModel as Mock).mockImplementation(
        class {
          getBlogBySlug = vi.fn().mockResolvedValue({
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
        } as never,
      );
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("returns 200 with HTML", async () => {
      const res = await app.request("https://ethang.dev/blog/my-post");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/html");
    });
  });

  describe("not found", () => {
    it("returns HTML for unknown routes", async () => {
      const res = await app.request("https://ethang.dev/this-does-not-exist");
      expect(res.headers.get("Content-Type")).toContain("text/html");
    });
  });

  describe("PUT /api/course-tracking/:userId/:courseId — status cycle", () => {
    let mockDb: ReturnType<typeof makeMockDb>;

    beforeEach(() => {
      mockDb = makeMockDb();
      (getDatabase as Mock).mockReturnValue(mockDb);
      (sanityClient.fetch as Mock).mockResolvedValue({
        url: "https://course.example.com",
      });
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("creates a new tracking entry with COMPLETE status when none exists", async () => {
      mockDb._findFirst.mockResolvedValue(undefined);

      const res = await app.request(
        "https://ethang.dev/api/course-tracking/user1/course1",
        { method: "PUT" },
      );

      expect(res.status).toBe(200);
      expect(mockDb._values).toHaveBeenCalledWith(
        expect.objectContaining({
          status: COURSE_TRACKING_STATUS.COMPLETE,
          userId: "user1",
        }),
      );
    });

    it("cycles COMPLETE status to REVISIT", async () => {
      const existing = {
        courseUrl: "https://course.example.com",
        id: "track-id",
        status: COURSE_TRACKING_STATUS.COMPLETE,
        userId: "user1",
      };
      mockDb._findFirst
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ ...existing, status: COURSE_TRACKING_STATUS.REVISIT });

      const res = await app.request(
        "https://ethang.dev/api/course-tracking/user1/course1",
        { method: "PUT" },
      );

      expect(res.status).toBe(200);
      expect(mockDb._set).toHaveBeenCalledWith({
        status: COURSE_TRACKING_STATUS.REVISIT,
      });
    });

    it("cycles REVISIT status to INCOMPLETE", async () => {
      const existing = {
        courseUrl: "https://course.example.com",
        id: "track-id",
        status: COURSE_TRACKING_STATUS.REVISIT,
        userId: "user1",
      };
      mockDb._findFirst
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({
          ...existing,
          status: COURSE_TRACKING_STATUS.INCOMPLETE,
        });

      const res = await app.request(
        "https://ethang.dev/api/course-tracking/user1/course1",
        { method: "PUT" },
      );

      expect(res.status).toBe(200);
      expect(mockDb._set).toHaveBeenCalledWith({
        status: COURSE_TRACKING_STATUS.INCOMPLETE,
      });
    });

    it("cycles INCOMPLETE status to COMPLETE", async () => {
      const existing = {
        courseUrl: "https://course.example.com",
        id: "track-id",
        status: COURSE_TRACKING_STATUS.INCOMPLETE,
        userId: "user1",
      };
      mockDb._findFirst
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({
          ...existing,
          status: COURSE_TRACKING_STATUS.COMPLETE,
        });

      const res = await app.request(
        "https://ethang.dev/api/course-tracking/user1/course1",
        { method: "PUT" },
      );

      expect(res.status).toBe(200);
      expect(mockDb._set).toHaveBeenCalledWith({
        status: COURSE_TRACKING_STATUS.COMPLETE,
      });
    });

    it("returns updated tracking data as JSON", async () => {
      const existing = {
        courseUrl: "https://course.example.com",
        id: "track-id",
        status: COURSE_TRACKING_STATUS.COMPLETE,
        userId: "user1",
      };
      const updated = { ...existing, status: COURSE_TRACKING_STATUS.REVISIT };
      mockDb._findFirst.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);

      const res = await app.request(
        "https://ethang.dev/api/course-tracking/user1/course1",
        { method: "PUT" },
      );

      const json = await res.json();
      expect(json.status).toBe(200);
    });
  });

  describe("GET /api/course-tracking/:userId", () => {
    let mockDb: ReturnType<typeof makeMockDb>;

    beforeEach(() => {
      mockDb = makeMockDb();
      (getDatabase as Mock).mockReturnValue(mockDb);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("returns course trackings for a user", async () => {
      const trackings = [
        {
          courseUrl: "https://course.example.com",
          id: "t1",
          status: COURSE_TRACKING_STATUS.COMPLETE,
          userId: "user1",
        },
      ];
      mockDb._findMany.mockResolvedValue(trackings);

      const res = await app.request(
        "https://ethang.dev/api/course-tracking/user1",
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toEqual(trackings);
    });
  });

  describe("GET /api/course-tracking/:userId/:courseId", () => {
    let mockDb: ReturnType<typeof makeMockDb>;

    beforeEach(() => {
      mockDb = makeMockDb();
      (getDatabase as Mock).mockReturnValue(mockDb);
      (sanityClient.fetch as Mock).mockResolvedValue({
        url: "https://course.example.com",
      });
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("returns the course tracking entry", async () => {
      const tracking = {
        courseUrl: "https://course.example.com",
        id: "t1",
        status: COURSE_TRACKING_STATUS.COMPLETE,
        userId: "user1",
      };
      mockDb._findFirst.mockResolvedValue(tracking);

      const res = await app.request(
        "https://ethang.dev/api/course-tracking/user1/course1",
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toEqual(tracking);
    });

    it("returns null data when tracking does not exist", async () => {
      mockDb._findFirst.mockResolvedValue(undefined);

      const res = await app.request(
        "https://ethang.dev/api/course-tracking/user1/course1",
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toBeUndefined();
    });
  });

  describe("GET /courses", () => {
    it("returns 200 with HTML", async () => {
      const res = await app.request("https://ethang.dev/courses");
      expect(res.status).toBe(200);
    });

    it("returns text/plain when format=text", async () => {
      const res = await app.request(
        "https://ethang.dev/courses?format=text",
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/plain");
    });
  });
});
