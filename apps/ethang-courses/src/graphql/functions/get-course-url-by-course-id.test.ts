import { describe, expect, it, vi } from "vitest";

vi.mock(import("../../clients/sanity.ts"), () => {
  return {
    sanityClient: {
      fetch: vi.fn()
    } as never
  };
});

import { sanityClient } from "../../clients/sanity.ts";
import { getCourseUrlByCourseId } from "./get-course-url-by-course-id.ts";

describe("getCourseUrlByCourseId", () => {
  it("returns course url when course exists", async () => {
    vi.mocked(sanityClient.fetch).mockResolvedValue({
      url: "https://example.com/course"
    } as never);

    await expect(getCourseUrlByCourseId("course-1")).resolves.toBe(
      "https://example.com/course"
    );
  });

  it("throws when course is missing", async () => {
    vi.mocked(sanityClient.fetch).mockResolvedValue(null as never);

    await expect(getCourseUrlByCourseId("missing")).rejects.toThrow(
      "Course not found"
    );
  });
});
