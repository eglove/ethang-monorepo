import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import worker from "./index.ts";

const APPLICATION_JSON = "application/json" as const;
const TEST_COURSE_NAME = "Test Course" as const;
const TEST_EMAIL = "test@test.com" as const;
const TEST_TOKEN = "test-token" as const;
const TEST_URL = "https://ethang.dev/api/rpc";
const MOCK_USER = {
  email: TEST_EMAIL,
  role: "user",
  sub: "test-user",
  username: "test-user"
};

const DEPLOYED_ARTICLES = { edges: [], pageInfo: { hasNextPage: false } };

const mockEnvironment = {
  ADMIN_PASS: "admin-pass",
  ADMIN_USER: "admin@test.com",
  ethang_courses: {
    course: vi.fn().mockResolvedValue({ id: "c1", name: TEST_COURSE_NAME }),
    courses: vi.fn().mockResolvedValue([{ id: "c1", name: TEST_COURSE_NAME }]),
    courseTracking: vi
      .fn()
      .mockResolvedValue({ id: "t1", status: "COMPLETED" }),
    createCurriculum: vi.fn().mockResolvedValue({ id: "cur-1" }),
    curriculums: vi.fn().mockResolvedValue([]),
    learningPath: vi.fn().mockResolvedValue({ id: "lp1" })
  },
  ethang_rss: {
    addSubscription: vi.fn().mockResolvedValue({ id: "sub-1" }),
    allArticles: vi.fn().mockResolvedValue(DEPLOYED_ARTICLES),
    feedArticles: vi.fn().mockResolvedValue(DEPLOYED_ARTICLES),
    markArticleRead: vi.fn().mockResolvedValue({ success: true }),
    subscription: vi.fn().mockResolvedValue({ id: "sub-1" }),
    subscriptions: vi
      .fn()
      .mockResolvedValue({ edges: [], pageInfo: { hasNextPage: false } })
  }
};

describe("POST /api/rpc - authentication", () => {
  it("should return 401 when verifySessionToken fails", async () => {
    vi.restoreAllMocks();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 401 })
    );

    const request = new Request(TEST_URL, {
      body: JSON.stringify({
        method: "courses",
        params: {},
        service: "ethang_courses"
      }),
      headers: { "Content-Type": APPLICATION_JSON, "X-Token": TEST_TOKEN },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, mockEnvironment);
    expect(response.status).toBe(401);
  });

  it("should return 401 if authentication fails", async () => {
    vi.restoreAllMocks();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 401 })
    );

    const request = new Request(TEST_URL, {
      body: JSON.stringify({
        method: "courses",
        params: {},
        service: "ethang_courses"
      }),
      headers: { "Content-Type": APPLICATION_JSON },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, mockEnvironment);
    expect(response.status).toBe(401);
  });

  it("should handle getSessionToken without X-Token successfully", async () => {
    vi.restoreAllMocks();
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        Response.json({ sessionToken: TEST_TOKEN }, { status: 200 })
      )
      .mockResolvedValueOnce(Response.json(MOCK_USER, { status: 200 }));

    const request = new Request(TEST_URL, {
      body: JSON.stringify({
        method: "courses",
        params: {},
        service: "ethang_courses"
      }),
      headers: { "Content-Type": APPLICATION_JSON },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, mockEnvironment);
    expect(response.status).toBe(200);

    expect(mockEnvironment.ethang_courses.courses).toHaveBeenCalledWith({
      sessionToken: TEST_TOKEN,
      userEmail: TEST_EMAIL,
      userSub: "test-user"
    });
  });
});

describe("POST /api/rpc - input validation", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(MOCK_USER, { status: 200 })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should return 400 for invalid JSON body", async () => {
    const request = new Request(TEST_URL, {
      body: "not-json",
      headers: { "Content-Type": APPLICATION_JSON, "X-Token": TEST_TOKEN },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, mockEnvironment);
    expect(response.status).toBe(400);
  });

  it("should return 400 for missing service or method", async () => {
    const request = new Request(TEST_URL, {
      body: JSON.stringify({ params: {} }),
      headers: { "Content-Type": APPLICATION_JSON, "X-Token": TEST_TOKEN },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, mockEnvironment);
    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid service name", async () => {
    const request = new Request(TEST_URL, {
      body: JSON.stringify({
        method: "courses",
        params: {},
        service: "non_existent"
      }),
      headers: { "Content-Type": APPLICATION_JSON, "X-Token": TEST_TOKEN },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, mockEnvironment);
    expect(response.status).toBe(400);
  });
});

describe("POST /api/rpc - ethang_courses dispatch", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(MOCK_USER, { status: 200 })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should dispatch to ethang_courses binding and return result", async () => {
    const request = new Request(TEST_URL, {
      body: JSON.stringify({
        method: "courses",
        params: {},
        service: "ethang_courses"
      }),
      headers: { "Content-Type": APPLICATION_JSON, "X-Token": TEST_TOKEN },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, mockEnvironment);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual([{ id: "c1", name: TEST_COURSE_NAME }]);

    expect(mockEnvironment.ethang_courses.courses).toHaveBeenCalledWith({
      sessionToken: TEST_TOKEN,
      userEmail: TEST_EMAIL,
      userSub: "test-user"
    });
  });

  it("should dispatch to ethang_courses course method", async () => {
    const request = new Request(TEST_URL, {
      body: JSON.stringify({
        method: "course",
        params: { id: "c1" },
        service: "ethang_courses"
      }),
      headers: { "Content-Type": APPLICATION_JSON, "X-Token": TEST_TOKEN },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, mockEnvironment);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({ id: "c1", name: TEST_COURSE_NAME });

    expect(mockEnvironment.ethang_courses.course).toHaveBeenCalledWith({
      id: "c1",
      sessionToken: TEST_TOKEN,
      userEmail: TEST_EMAIL,
      userSub: "test-user"
    });
  });

  it("should dispatch to ethang_courses courseTracking method", async () => {
    const request = new Request(TEST_URL, {
      body: JSON.stringify({
        method: "courseTracking",
        params: { courseId: "c1" },
        service: "ethang_courses"
      }),
      headers: { "Content-Type": APPLICATION_JSON, "X-Token": TEST_TOKEN },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, mockEnvironment);
    expect(response.status).toBe(200);

    expect(mockEnvironment.ethang_courses.courseTracking).toHaveBeenCalledWith({
      courseId: "c1",
      sessionToken: TEST_TOKEN,
      userEmail: TEST_EMAIL,
      userSub: "test-user"
    });
  });

  it("should dispatch to ethang_courses createCurriculum method", async () => {
    const request = new Request(TEST_URL, {
      body: JSON.stringify({
        method: "createCurriculum",
        params: { name: "New Curriculum" },
        service: "ethang_courses"
      }),
      headers: { "Content-Type": APPLICATION_JSON, "X-Token": TEST_TOKEN },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, mockEnvironment);
    expect(response.status).toBe(200);

    expect(
      mockEnvironment.ethang_courses.createCurriculum
    ).toHaveBeenCalledWith({
      name: "New Curriculum",
      sessionToken: TEST_TOKEN,
      userEmail: TEST_EMAIL,
      userSub: "test-user"
    });
  });

  it("should dispatch to ethang_courses learningPath method", async () => {
    const request = new Request(TEST_URL, {
      body: JSON.stringify({
        method: "learningPath",
        params: { id: "lp1" },
        service: "ethang_courses"
      }),
      headers: { "Content-Type": APPLICATION_JSON, "X-Token": TEST_TOKEN },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, mockEnvironment);
    expect(response.status).toBe(200);
  });

  it("should dispatch to ethang_courses curriculums method", async () => {
    const request = new Request(TEST_URL, {
      body: JSON.stringify({
        method: "curriculums",
        params: {},
        service: "ethang_courses"
      }),
      headers: { "Content-Type": APPLICATION_JSON, "X-Token": TEST_TOKEN },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, mockEnvironment);
    expect(response.status).toBe(200);
  });
});

describe("POST /api/rpc - ethang_rss dispatch", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(MOCK_USER, { status: 200 })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should dispatch to ethang_rss binding and return result", async () => {
    const request = new Request(TEST_URL, {
      body: JSON.stringify({
        method: "allArticles",
        params: { first: 10 },
        service: "ethang_rss"
      }),
      headers: { "Content-Type": APPLICATION_JSON, "X-Token": TEST_TOKEN },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, mockEnvironment);
    expect(response.status).toBe(200);

    expect(mockEnvironment.ethang_rss.allArticles).toHaveBeenCalledWith({
      first: 10,
      sessionToken: TEST_TOKEN,
      userEmail: TEST_EMAIL,
      userSub: "test-user"
    });
  });

  it("should dispatch to ethang_rss feedArticles method", async () => {
    const request = new Request(TEST_URL, {
      body: JSON.stringify({
        method: "feedArticles",
        params: { feedId: "f1", first: 5 },
        service: "ethang_rss"
      }),
      headers: { "Content-Type": APPLICATION_JSON, "X-Token": TEST_TOKEN },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, mockEnvironment);
    expect(response.status).toBe(200);

    expect(mockEnvironment.ethang_rss.feedArticles).toHaveBeenCalledWith({
      feedId: "f1",
      first: 5,
      sessionToken: TEST_TOKEN,
      userEmail: TEST_EMAIL,
      userSub: "test-user"
    });
  });

  it("should dispatch to ethang_rss addSubscription method", async () => {
    const request = new Request(TEST_URL, {
      body: JSON.stringify({
        method: "addSubscription",
        params: { xmlAddress: "https://example.com/feed.xml" },
        service: "ethang_rss"
      }),
      headers: { "Content-Type": APPLICATION_JSON, "X-Token": TEST_TOKEN },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, mockEnvironment);
    expect(response.status).toBe(200);

    expect(mockEnvironment.ethang_rss.addSubscription).toHaveBeenCalledWith({
      sessionToken: TEST_TOKEN,
      userEmail: TEST_EMAIL,
      userSub: "test-user",
      xmlAddress: "https://example.com/feed.xml"
    });
  });

  it("should dispatch to ethang_rss markArticleRead method", async () => {
    const request = new Request(TEST_URL, {
      body: JSON.stringify({
        method: "markArticleRead",
        params: { articleId: "a1", isRead: true },
        service: "ethang_rss"
      }),
      headers: { "Content-Type": APPLICATION_JSON, "X-Token": TEST_TOKEN },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, mockEnvironment);
    expect(response.status).toBe(200);

    expect(mockEnvironment.ethang_rss.markArticleRead).toHaveBeenCalledWith({
      articleId: "a1",
      isRead: true,
      sessionToken: TEST_TOKEN,
      userEmail: TEST_EMAIL,
      userSub: "test-user"
    });
  });

  it("should dispatch to ethang_rss subscriptions method", async () => {
    const request = new Request(TEST_URL, {
      body: JSON.stringify({
        method: "subscriptions",
        params: { first: 10 },
        service: "ethang_rss"
      }),
      headers: { "Content-Type": APPLICATION_JSON, "X-Token": TEST_TOKEN },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, mockEnvironment);
    expect(response.status).toBe(200);

    expect(mockEnvironment.ethang_rss.subscriptions).toHaveBeenCalledWith({
      first: 10,
      sessionToken: TEST_TOKEN,
      userEmail: TEST_EMAIL,
      userSub: "test-user"
    });
  });

  it("should dispatch to ethang_rss subscription method", async () => {
    const request = new Request(TEST_URL, {
      body: JSON.stringify({
        method: "subscription",
        params: { feedId: "f1" },
        service: "ethang_rss"
      }),
      headers: { "Content-Type": APPLICATION_JSON, "X-Token": TEST_TOKEN },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, mockEnvironment);
    expect(response.status).toBe(200);
  });
});

describe("POST /api/rpc - error handling", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(MOCK_USER, { status: 200 })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should return 500 for invalid method on a valid service", async () => {
    const request = new Request(TEST_URL, {
      body: JSON.stringify({
        method: "nonExistentMethod",
        params: {},
        service: "ethang_courses"
      }),
      headers: { "Content-Type": APPLICATION_JSON, "X-Token": TEST_TOKEN },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, mockEnvironment);
    expect(response.status).toBe(500);
  });

  it("should return 500 if service binding throws", async () => {
    const errorEnvironment = {
      ...mockEnvironment,
      ethang_courses: {
        courses: vi.fn().mockRejectedValue(new Error("DB Error"))
      }
    };

    const request = new Request(TEST_URL, {
      body: JSON.stringify({
        method: "courses",
        params: {},
        service: "ethang_courses"
      }),
      headers: { "Content-Type": APPLICATION_JSON, "X-Token": TEST_TOKEN },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, errorEnvironment);
    expect(response.status).toBe(500);
    const body = await response.text();
    expect(body).toBe("DB Error");
  });

  it("should return 500 with Internal Server Error when a non-Error is thrown", async () => {
    const errorEnvironment = {
      ...mockEnvironment,
      ethang_courses: {
        courses: vi.fn().mockRejectedValue("string error")
      }
    };

    const request = new Request(TEST_URL, {
      body: JSON.stringify({
        method: "courses",
        params: {},
        service: "ethang_courses"
      }),
      headers: { "Content-Type": APPLICATION_JSON, "X-Token": TEST_TOKEN },
      method: "POST"
    });

    // @ts-expect-error test double
    const response = await worker.fetch(request, errorEnvironment);
    expect(response.status).toBe(500);
    const body = await response.text();
    expect(body).toBe("Internal Server Error");
  });
});

describe("POST /api/rpc - routing", () => {
  it("should return 404 for unknown routes", async () => {
    const request = new Request("https://ethang.dev/api/unknown");

    // @ts-expect-error test double
    const response = await worker.fetch(request, mockEnvironment);
    expect(response.status).toBe(404);
  });
});
