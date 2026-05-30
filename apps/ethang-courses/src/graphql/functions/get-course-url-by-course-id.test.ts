import { describe, expect, it, vi } from "vitest";

import { sanityClient } from "../../clients/sanity.ts";
import { getCourseUrlByCourseId } from "./get-course-url-by-course-id.ts";

describe("getCourseUrlByCourseId", () => {
  it("returns course url when course exists", async () => {
    const fetchSpy = vi.spyOn(sanityClient, "fetch");
    // @ts-expect-error mocked payload for generic client response
    fetchSpy.mockResolvedValue({ url: "https://example.com/course" });

    await expect(getCourseUrlByCourseId("course-1")).resolves.toBe(
      "https://example.com/course"
    );
  });

  it("throws when course is missing", async () => {
    const fetchSpy = vi.spyOn(sanityClient, "fetch");
    // @ts-expect-error mocked payload for generic client response
    fetchSpy.mockResolvedValue(null);

    await expect(getCourseUrlByCourseId("missing")).rejects.toThrow(
      "Course not found"
    );
  });
});
