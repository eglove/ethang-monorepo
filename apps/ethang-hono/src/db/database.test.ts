import { describe, expect, it, vi } from "vitest";

vi.mock(import("drizzle-orm/d1"), () => ({
  drizzle: vi.fn().mockReturnValue({}),
}));

import { drizzle } from "drizzle-orm/d1";

import { getDatabase } from "./database.ts";

describe(getDatabase, () => {
  it("calls drizzle with the D1 binding and returns the result", () => {
    const mockD1 = {} as CloudflareBindings["ethang_hono"];
    const mockContext = { env: { ethang_hono: mockD1 } };

    const result = getDatabase(mockContext as never);

    expect(vi.mocked(drizzle).mock.calls[0]?.[0]).toBe(mockD1);
    expect(result).toBeDefined();
  });
});
