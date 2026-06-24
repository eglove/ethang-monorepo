import { describe, expect, it, vi } from "vitest";

import { getReadStateFilter } from "./read-filter.ts";

describe("getReadStateFilter", () => {
  it("should return undefined if options are empty", () => {
    const mockDatabase = {} as any;
    const result = getReadStateFilter(mockDatabase, "user-1");
    expect(result).toBeUndefined();
  });

  it("should build inArray filter when isRead is true", () => {
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnValue("mock-subquery")
      })
    } as any;

    const result = getReadStateFilter(mockDatabase, "user-1", { isRead: true });
    expect(result).toBeDefined();
    expect(mockDatabase.select).toHaveBeenCalled();
  });

  it("should build not(inArray) filter when isRead is false", () => {
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnValue("mock-subquery")
      })
    } as any;

    const result = getReadStateFilter(mockDatabase, "user-1", {
      isRead: false
    });
    expect(result).toBeDefined();
    expect(mockDatabase.select).toHaveBeenCalled();
  });
});
