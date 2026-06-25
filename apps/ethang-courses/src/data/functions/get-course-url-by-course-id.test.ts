import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "../../errors/not-found-error.ts";
import { getCourseUrlByCourseId } from "./get-course-url-by-course-id.ts";

describe("getCourseUrlByCourseId", () => {
  it("returns course url when course exists", async () => {
    const mockDatabase = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ url: "https://example.com/course" }]),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis()
    };

    const result = await Effect.runPromise(
      // @ts-expect-error for test
      getCourseUrlByCourseId(mockDatabase, "course-1")
    );

    expect(result).toBe("https://example.com/course");
  });

  it("fails with NotFoundError when course is missing", async () => {
    const mockDatabase = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis()
    };

    const result = await Effect.runPromise(
      // @ts-expect-error for test
      getCourseUrlByCourseId(mockDatabase, "missing").pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(NotFoundError);
  });

  it("fails with NotFoundError when course is undefined at index 0", async () => {
    const mockDatabase = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([undefined]),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis()
    };

    const result = await Effect.runPromise(
      // @ts-expect-error for test
      getCourseUrlByCourseId(mockDatabase, "missing").pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(NotFoundError);
  });
});
