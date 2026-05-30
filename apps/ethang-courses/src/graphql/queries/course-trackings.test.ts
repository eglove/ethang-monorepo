import { describe, expect, it, vi } from "vitest";

import { courseTrackingsQuery } from "./course-trackings.ts";

describe("courseTrackingsQuery", () => {
  it("returns course trackings for a user", async () => {
    const mockTrackings = [
      { id: "3", status: "complete" },
      { id: "2", status: "in-progress" },
      { id: "1", status: "not-started" }
    ];

    const mockDatabase = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockTrackings),
      orderBy: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis()
    };

    // @ts-expect-error test double
    const resolver = courseTrackingsQuery(mockDatabase);
    const result = await resolver(undefined, {
      first: 2,
      userId: "user-1"
    });

    expect(result).toStrictEqual({
      edges: [
        { cursor: "3", node: { id: "3", status: "complete" } },
        { cursor: "2", node: { id: "2", status: "in-progress" } }
      ],
      pageInfo: {
        endCursor: "2",
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: "3"
      }
    });
  });

  it("handles empty results", async () => {
    const mockDatabase = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      orderBy: vi.fn().mockResolvedValue([]),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis()
    };

    // @ts-expect-error test double
    const resolver = courseTrackingsQuery(mockDatabase);
    const result = await resolver(undefined, {
      userId: "user-1"
    });

    expect(result).toStrictEqual({
      edges: [],
      pageInfo: {
        endCursor: null,
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null
      }
    });
  });

  it("handles pagination with after cursor", async () => {
    const mockDatabase = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ id: "1", status: "not-started" }]),
      orderBy: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis()
    };

    // @ts-expect-error test double
    const resolver = courseTrackingsQuery(mockDatabase);
    const result = await resolver(undefined, {
      after: "2",
      first: 2,
      userId: "user-1"
    });

    expect(result.pageInfo.hasNextPage).toBe(false);
  });
});
