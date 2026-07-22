import { describe, expect, it, vi } from "vitest";

import { cleanupOldArticles } from "./cleanup-old-articles.ts";

const CUTOFF_ISO = "2026-04-01T00:00:00.000Z";
const OLD_ARTICLE = "old-article";

describe("cleanupOldArticles", () => {
  it("should delete old articles and their user states when cutoff is valid", async () => {
    const mockWhere = vi.fn().mockResolvedValue({});
    const mockSelectResult = [{ id: "article-1" }, { id: "article-2" }];
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnValue(mockSelectResult)
    });
    const mockDelete = vi.fn().mockReturnValue({ where: mockWhere });

    const mockDatabase = {
      delete: mockDelete,
      select: mockSelect
    };

    // @ts-expect-error for test
    await cleanupOldArticles(mockDatabase, CUTOFF_ISO);

    expect(mockSelect).toHaveBeenCalledOnce();
    expect(mockDelete).toHaveBeenCalledTimes(2);
    expect(mockWhere).toHaveBeenCalledTimes(2);
  });

  it("should use default 90-day cutoff when cutoff is undefined", async () => {
    const mockWhere = vi.fn().mockResolvedValue({});
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnValue([{ id: OLD_ARTICLE }])
    });
    const mockDelete = vi.fn().mockReturnValue({ where: mockWhere });

    const mockDatabase = {
      delete: mockDelete,
      select: mockSelect
    };

    // @ts-expect-error for test
    await cleanupOldArticles(mockDatabase, null);

    expect(mockSelect).toHaveBeenCalledOnce();
    expect(mockDelete).toHaveBeenCalledTimes(2);
  });

  it("should use default 90-day cutoff when cutoff is invalid", async () => {
    const mockWhere = vi.fn().mockResolvedValue({});
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnValue([{ id: OLD_ARTICLE }])
    });
    const mockDelete = vi.fn().mockReturnValue({ where: mockWhere });

    const mockDatabase = {
      delete: mockDelete,
      select: mockSelect
    };

    // @ts-expect-error for test
    await cleanupOldArticles(mockDatabase, "not-a-date");

    expect(mockSelect).toHaveBeenCalledOnce();
    expect(mockDelete).toHaveBeenCalledTimes(2);
  });

  it("should use default 90-day cutoff when cutoff is null", async () => {
    const mockWhere = vi.fn().mockResolvedValue({});
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnValue([{ id: OLD_ARTICLE }])
    });
    const mockDelete = vi.fn().mockReturnValue({ where: mockWhere });

    const mockDatabase = {
      delete: mockDelete,
      select: mockSelect
    };

    // @ts-expect-error for test
    await cleanupOldArticles(mockDatabase, null);

    expect(mockSelect).toHaveBeenCalledOnce();
    expect(mockDelete).toHaveBeenCalledTimes(2);
  });

  it("should use default 90-day cutoff when cutoff is empty string", async () => {
    const mockWhere = vi.fn().mockResolvedValue({});
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnValue([{ id: OLD_ARTICLE }])
    });
    const mockDelete = vi.fn().mockReturnValue({ where: mockWhere });

    const mockDatabase = {
      delete: mockDelete,
      select: mockSelect
    };

    // @ts-expect-error for test
    await cleanupOldArticles(mockDatabase, "");

    expect(mockSelect).toHaveBeenCalledOnce();
    expect(mockDelete).toHaveBeenCalledTimes(2);
  });

  it("should not call delete when no articles are old", async () => {
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnValue([])
    });
    const mockDelete = vi.fn();

    const mockDatabase = {
      delete: mockDelete,
      select: mockSelect
    };

    // @ts-expect-error for test
    await cleanupOldArticles(mockDatabase, CUTOFF_ISO);

    expect(mockSelect).toHaveBeenCalledOnce();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("should delete user states with matching article IDs", async () => {
    const mockArticles = [{ id: "a1" }, { id: "a2" }];
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnValue(mockArticles)
    });
    const mockWhere = vi.fn().mockResolvedValue({});
    const mockDelete = vi.fn().mockReturnValue({ where: mockWhere });

    const mockDatabase = {
      delete: mockDelete,
      select: mockSelect
    };

    // @ts-expect-error for test
    await cleanupOldArticles(mockDatabase, CUTOFF_ISO);

    // Collect all where mock calls
    const whereCalls = mockWhere.mock.calls;
    expect(whereCalls).toHaveLength(2);
  });

  it("should batch-delete articles when there are more than 100 old articles", async () => {
    // Create 250 old articles to test chunking behavior
    const mockArticles = Array.from({ length: 250 }, (_, index) => {
      return { id: `article-${index}` };
    });
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnValue(mockArticles)
    });
    const mockWhere = vi.fn().mockResolvedValue({});
    const mockDelete = vi.fn().mockReturnValue({ where: mockWhere });

    const mockDatabase = {
      delete: mockDelete,
      select: mockSelect
    };

    // @ts-expect-error for test
    await cleanupOldArticles(mockDatabase, CUTOFF_ISO);

    // 250 articles → 3 chunks of userItemStates + 3 chunks of articles = 6 delete calls
    expect(mockDelete).toHaveBeenCalledTimes(6);
  });

  it("should batch-delete articles when there are exactly 100 old articles", async () => {
    const mockArticles = Array.from({ length: 100 }, (_, index) => {
      return { id: `article-${index}` };
    });
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnValue(mockArticles)
    });
    const mockWhere = vi.fn().mockResolvedValue({});
    const mockDelete = vi.fn().mockReturnValue({ where: mockWhere });

    const mockDatabase = {
      delete: mockDelete,
      select: mockSelect
    };

    // @ts-expect-error for test
    await cleanupOldArticles(mockDatabase, CUTOFF_ISO);

    // 100 articles → 1 chunk of userItemStates + 1 chunk of articles = 2 delete calls
    expect(mockDelete).toHaveBeenCalledTimes(2);
  });
});
