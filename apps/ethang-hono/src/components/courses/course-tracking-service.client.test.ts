// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import { CourseTrackingService } from "./course-tracking-service.client.js";

describe(CourseTrackingService, () => {
  it("fetchStoredStatuses returns data on success", async () => {
    const service = new CourseTrackingService();
    const mockData = {
      data: [{ courseUrl: "url1", id: "id1", status: "Complete", userId: "u1" }]
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        // eslint-disable-next-line @typescript-eslint/require-await
        json: async () => {
          return mockData;
        },
        ok: true
      })
    );

    const result = await service.fetchStoredStatuses("u1");

    expect(result).toStrictEqual(mockData.data);
  });

  it("fetchStoredStatuses returns null on failure", async () => {
    const service = new CourseTrackingService();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false
      })
    );

    const result = await service.fetchStoredStatuses("u1");

    expect(result).toBeNull();
  });

  it("updateCourseStatus returns status on success", async () => {
    const service = new CourseTrackingService();
    const mockData = {
      data: {
        courseUrl: "url1",
        id: "id1",
        status: "Complete",
        userId: "u1"
      }
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        // eslint-disable-next-line @typescript-eslint/require-await
        json: async () => {
          return mockData;
        },
        ok: true
      })
    );

    const result = await service.updateCourseStatus("id1", "u1");

    expect(result).toBe("Complete");
  });

  it("verifyToken returns userId on success", async () => {
    const service = new CourseTrackingService();
    const mockUser = {
      email: "e",
      exp: 1,
      iat: 1,
      sub: "user-123",
      username: "u"
    };

    document.cookie = "ethang-auth-token=valid-token";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        // eslint-disable-next-line @typescript-eslint/require-await
        json: async () => {
          return mockUser;
        },
        ok: true
      })
    );

    const result = await service.verifyToken();

    expect(result).toBe("user-123");
  });

  it("verifyToken handles verification failure", async () => {
    const service = new CourseTrackingService();

    document.cookie = "ethang-auth-token=invalid-token";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false
      })
    );
    vi.stubGlobal("location", { reload: vi.fn() });

    const result = await service.verifyToken();

    expect(result).toBeNull();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(globalThis.location.reload).toHaveBeenCalledWith();
  });
});
