import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { courseTrackingsQuery } from "./course-trackings.ts";

describe("courseTrackingsQuery", () => {
  it("returns all course trackings for a user", async () => {
    const mockRecords = [
      {
        courseUrl: "https://example.com/course-1",
        id: "tracking-1",
        status: "INCOMPLETE",
        userId: "user-1"
      },
      {
        courseUrl: "https://example.com/course-2",
        id: "tracking-2",
        status: "COMPLETE",
        userId: "user-1"
      }
    ];

    const mockSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockRecords)
    };

    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      courseTrackingsQuery(mockDatabase, "user-1")
    );

    expect(result).toStrictEqual(mockRecords);
    expect(mockDatabase.select).toHaveBeenCalled();
  });

  it("returns empty array when no trackings exist", async () => {
    const mockSelectResult = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([])
    };

    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      courseTrackingsQuery(mockDatabase, "user-1")
    );

    expect(result).toStrictEqual([]);
  });
});
