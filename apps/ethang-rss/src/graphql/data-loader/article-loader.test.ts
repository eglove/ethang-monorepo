import { describe, expect, it, vi } from "vitest";

import { createArticleLoader } from "./article-loader.ts";

describe("articleLoader", () => {
  it("loads articles by id", async () => {
    const mockArticles = [
      { id: "1", title: "Article 1" },
      { id: "2", title: "Article 2" }
    ];

    const mockWhere = vi.fn().mockReturnValue(Promise.resolve(mockArticles));
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
    const loader = createArticleLoader(mockDatabase);
    const result = await loader.loadMany(["1", "2", "3"]);

    expect(result[0]).toEqual(mockArticles[0]);
    expect(result[1]).toEqual(mockArticles[1]);
    expect(result[2]).toBeNull();
  });
});
