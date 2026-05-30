import { afterEach, describe, expect, it, vi } from "vitest";

import { globalStore } from "../stores/global-store-properties.ts";
import {
  cycleCourseTrackingStatus,
  getCourseTrackingByUserIdCourseId,
  getCourseTrackingsByUserId
} from "./course-tracking-graphql.ts";

const makeContext = (service?: { fetch: (request: Request) => unknown }) => {
  return {
    env: {
      ethang_graphql: service
    }
  };
};

const makeJsonResponse = (payload: unknown, status = 200) => {
  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json"
    },
    status
  });
};

describe("course-tracking-graphql client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    globalStore.authToken = null;
  });

  it("flattens courseTrackings connection edges", async () => {
    const service = {
      fetch: vi.fn(() => {
        return Promise.resolve(
          makeJsonResponse({
            data: {
              courseTrackings: {
                edges: [
                  {
                    node: {
                      courseUrl: "url-1",
                      id: "id-1",
                      status: "Complete",
                      userId: "user-1"
                    }
                  }
                ]
              }
            }
          })
        );
      })
    };

    const result = await getCourseTrackingsByUserId(
      makeContext(service) as never,
      "user-1"
    );

    expect(result).toStrictEqual([
      {
        courseUrl: "url-1",
        id: "id-1",
        status: "Complete",
        userId: "user-1"
      }
    ]);
  });

  it("returns empty array when connection is missing", async () => {
    const service = {
      fetch: vi.fn(() => {
        return Promise.resolve(
          makeJsonResponse({
            data: {}
          })
        );
      })
    };

    const result = await getCourseTrackingsByUserId(
      makeContext(service) as never,
      "user-1"
    );

    expect(result).toStrictEqual([]);
  });

  it("uses global fetch fallback when service binding is unavailable", async () => {
    const fetchMock = vi.fn(() => {
      return Promise.resolve(
        makeJsonResponse({
          data: {
            courseTracking: {
              courseUrl: "url-1",
              id: "id-1",
              status: "Complete",
              userId: "user-1"
            }
          }
        })
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getCourseTrackingByUserIdCourseId(
      makeContext(undefined) as never,
      "user-1",
      "course-1"
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual({
      courseUrl: "url-1",
      id: "id-1",
      status: "Complete",
      userId: "user-1"
    });
  });

  it("adds X-Token header when auth token exists", async () => {
    globalStore.authToken = "token-1";
    const service = {
      fetch: vi.fn((request: Request) => {
        expect(request.headers.get("X-Token")).toBe("token-1");

        return Promise.resolve(
          makeJsonResponse({
            data: {
              cycleCourseTrackingStatus: {
                courseUrl: "url-1",
                id: "id-1",
                status: "Revisit",
                userId: "user-1"
              }
            }
          })
        );
      })
    };

    const result = await cycleCourseTrackingStatus(
      makeContext(service) as never,
      "user-1",
      "course-1"
    );

    expect(result?.status).toBe("Revisit");
  });

  it("throws when HTTP response is not ok", async () => {
    const service = {
      fetch: vi.fn(() => {
        return Promise.resolve(makeJsonResponse({ data: {} }, 500));
      })
    };

    await expect(
      getCourseTrackingsByUserId(makeContext(service) as never, "user-1")
    ).rejects.toThrow("Course tracking GraphQL request failed");
  });

  it("throws GraphQL error message when payload has errors", async () => {
    const service = {
      fetch: vi.fn(() => {
        return Promise.resolve(
          makeJsonResponse({
            errors: [{ message: "boom" }]
          })
        );
      })
    };

    await expect(
      getCourseTrackingsByUserId(makeContext(service) as never, "user-1")
    ).rejects.toThrow("boom");
  });

  it("uses fallback GraphQL error message when missing", async () => {
    const service = {
      fetch: vi.fn(() => {
        return Promise.resolve(
          makeJsonResponse({
            errors: [{}]
          })
        );
      })
    };

    await expect(
      getCourseTrackingsByUserId(makeContext(service) as never, "user-1")
    ).rejects.toThrow("Course tracking GraphQL error");
  });

  it("throws when GraphQL payload has no data", async () => {
    const service = {
      fetch: vi.fn(() => {
        return Promise.resolve(makeJsonResponse({}));
      })
    };

    await expect(
      getCourseTrackingsByUserId(makeContext(service) as never, "user-1")
    ).rejects.toThrow("Course tracking GraphQL response missing data");
  });

  it("throws when service fetch does not return a promise", async () => {
    const service = {
      fetch: vi.fn(() => {
        return makeJsonResponse({ data: {} });
      })
    };

    await expect(
      getCourseTrackingsByUserId(makeContext(service) as never, "user-1")
    ).rejects.toThrow("ethang_graphql service returned non-promise response");
  });

  it("throws when service fetch promise resolves to non-Response", async () => {
    const service = {
      fetch: vi.fn(() => {
        return Promise.resolve({});
      })
    };

    await expect(
      getCourseTrackingsByUserId(makeContext(service) as never, "user-1")
    ).rejects.toThrow("ethang_graphql service returned invalid response");
  });
});
