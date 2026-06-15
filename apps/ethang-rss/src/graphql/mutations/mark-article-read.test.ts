import { describe, expect, it, vi } from "vitest";

import { markArticleReadMutation } from "./mark-article-read.ts";

const mockContext = {
  user: {
    sub: "user-1"
  }
};

describe("markArticleReadMutation", () => {
  it("should insert state and return the article if found", async () => {
    const mockArticle = { id: "article-1", title: "Test Article" };

    const mockInsertResult = {
      onConflictDoUpdate: vi.fn().mockResolvedValue({}),
      values: vi.fn().mockReturnThis()
    };

    const mockSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockArticle])
    };

    const mockDatabase = {
      insert: vi.fn().mockReturnValue(mockInsertResult),
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    // @ts-expect-error test double
    const resolver = markArticleReadMutation(mockDatabase);
    const result = await resolver(
      undefined,
      { articleId: "article-1", isRead: true },
      mockContext
    );

    expect(result).toStrictEqual(mockArticle);
    expect(mockDatabase.insert).toHaveBeenCalled();
    expect(mockDatabase.select).toHaveBeenCalled();
  });

  it("should throw an error if the article is not found", async () => {
    const mockInsertResult = {
      onConflictDoUpdate: vi.fn().mockResolvedValue({}),
      values: vi.fn().mockReturnThis()
    };

    const mockSelectResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([])
    };

    const mockDatabase = {
      insert: vi.fn().mockReturnValue(mockInsertResult),
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    // @ts-expect-error test double
    const resolver = markArticleReadMutation(mockDatabase);

    await expect(
      resolver(undefined, { articleId: "article-2", isRead: true }, mockContext)
    ).rejects.toThrow("Article not found");
  });
});
