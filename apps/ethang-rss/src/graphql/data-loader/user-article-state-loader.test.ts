import { describe, expect, it, vi } from "vitest";

import { createUserArticleStateLoader } from "./user-article-state-loader.ts";

describe("userArticleStateLoader", () => {
  it("loads user article states by id", async () => {
    const userId = "user-123";
    const mockStates = [
      { articleId: "1", status: "read", userId },
      { articleId: "2", status: "unread", userId }
    ];

    const mockWhere = vi.fn().mockReturnValue(Promise.resolve(mockStates));
    const mockFrom = vi.fn().mockReturnValue({
      where: mockWhere
    });
    const mockSelect = vi.fn().mockReturnValue({
      from: mockFrom
    });

    const mockDatabase = {
      select: mockSelect
    };

    // @ts-expect-error test
    const loader = createUserArticleStateLoader(mockDatabase, userId);
    const result = await loader.loadMany(["1", "2", "3"]);

    expect(result[0]).toEqual(mockStates[0]);
    expect(result[1]).toEqual(mockStates[1]);
    expect(result[2]).toBeNull();
  });
});
