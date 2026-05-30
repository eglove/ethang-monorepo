import assign from "lodash/assign.js";
import { describe, expect, it, vi } from "vitest";

import { courseTrackingsQuery } from "./course-trackings.ts";

type Tracking = {
  courseUrl: string;
  id: string;
  status: string;
  userId: string;
};

const createDatabaseMock = (trackings: Tracking[]) => {
  const limit = vi.fn((count: number) => {
    return trackings.slice(0, count);
  });
  const basePromise = Promise.resolve(trackings);
  const orderByResult = assign(basePromise, { limit });
  const orderBy = vi.fn(async () => {
    return orderByResult;
  });
  const where = vi.fn(() => {
    return { orderBy };
  });
  const from = vi.fn(() => {
    return { where };
  });
  const select = vi.fn(() => {
    return {
      from
    };
  });

  const database = {
    select
  };

  return { database, limit, where };
};

describe("courseTrackingsQuery", () => {
  it("returns all records when first is omitted", async () => {
    const trackings = [
      { courseUrl: "url-1", id: "3", status: "Complete", userId: "user-1" },
      { courseUrl: "url-2", id: "2", status: "Revisit", userId: "user-1" }
    ];
    const { database, limit } = createDatabaseMock(trackings);

    // @ts-expect-error minimal database test double for this unit test
    const resolver = courseTrackingsQuery(database);
    const result = await resolver(undefined, { userId: "user-1" });

    expect(limit).not.toHaveBeenCalled();
    expect(result.pageInfo.hasNextPage).toBe(false);
    expect(result.pageInfo.startCursor).toBe("3");
    expect(result.pageInfo.endCursor).toBe("2");
    expect(result.edges).toStrictEqual([
      { cursor: "3", node: trackings[0] },
      { cursor: "2", node: trackings[1] }
    ]);
  });

  it("uses first + 1 to compute hasNextPage", async () => {
    const trackings = [
      { courseUrl: "url-1", id: "3", status: "Complete", userId: "user-1" },
      { courseUrl: "url-2", id: "2", status: "Revisit", userId: "user-1" },
      {
        courseUrl: "url-3",
        id: "1",
        status: "Incomplete",
        userId: "user-1"
      }
    ];
    const { database, limit } = createDatabaseMock(trackings);

    // @ts-expect-error minimal database test double for this unit test
    const resolver = courseTrackingsQuery(database);
    const result = await resolver(undefined, { first: 2, userId: "user-1" });

    expect(limit).toHaveBeenCalledWith(3);
    expect(result.pageInfo.hasNextPage).toBe(true);
    expect(result.edges).toHaveLength(2);
    expect(result.pageInfo.startCursor).toBe("3");
    expect(result.pageInfo.endCursor).toBe("2");
  });

  it("supports cursor pagination with after argument", async () => {
    const trackings = [
      { courseUrl: "url-2", id: "2", status: "Revisit", userId: "user-1" }
    ];
    const { database, where } = createDatabaseMock(trackings);

    // @ts-expect-error minimal database test double for this unit test
    const resolver = courseTrackingsQuery(database);
    await resolver(undefined, { after: "3", first: 1, userId: "user-1" });

    expect(where).toHaveBeenCalledTimes(1);
  });
});
