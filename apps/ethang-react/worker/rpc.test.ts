import { describe, expect, it, vi } from "vitest";

import { rpcServiceDispatch } from "./rpc.ts";

type Environment = Record<string, unknown>;

const mockBinding = {
  allArticles: vi
    .fn()
    .mockResolvedValue({ edges: [], pageInfo: { hasNextPage: false } }),
  courses: vi.fn().mockResolvedValue([{ id: "c1", name: "Course 1" }]),
  removeSubscription: vi.fn().mockResolvedValue(undefined)
};

const mockEnvironment: Environment = {
  ethang_courses: mockBinding,
  ethang_rss: mockBinding
};

describe("rpcServiceDispatch", () => {
  it("dispatches to ethang_courses service", async () => {
    const result = await rpcServiceDispatch(
      // @ts-expect-error for test
      mockEnvironment,
      "ethang_courses",
      "courses",
      {}
    );

    expect(mockBinding.courses).toHaveBeenCalledWith({});
    expect(result).toEqual([{ id: "c1", name: "Course 1" }]);
  });

  it("dispatches to ethang_rss service", async () => {
    // @ts-expect-error for test
    await rpcServiceDispatch(mockEnvironment, "ethang_rss", "allArticles", {
      first: 10
    });

    expect(mockBinding.allArticles).toHaveBeenCalledWith({ first: 10 });
  });

  it("dispatches removeSubscription to ethang_rss service", async () => {
    const result = await rpcServiceDispatch(
      // @ts-expect-error for test
      mockEnvironment,
      "ethang_rss",
      "removeSubscription",
      { feedId: "feed-1", sessionToken: "token" }
    );

    expect(mockBinding.removeSubscription).toHaveBeenCalledWith({
      feedId: "feed-1",
      sessionToken: "token"
    });
    expect(result).toBeUndefined();
  });

  it("throws 'Invalid service' when service is not recognized", async () => {
    await expect(
      // @ts-expect-error for test
      rpcServiceDispatch(mockEnvironment, "unknown_service", "courses", {})
    ).rejects.toThrow("Invalid service");
  });

  it("throws 'Invalid method' when method is not in the dispatch map", async () => {
    await expect(
      rpcServiceDispatch(
        // @ts-expect-error for test
        mockEnvironment,
        "ethang_courses",
        "nonExistentMethod",
        {}
      )
    ).rejects.toThrow("Invalid method");
  });

  it("throws 'Invalid service' when service binding is missing from environment", async () => {
    const environmentWithoutBinding: Environment = {};

    await expect(
      rpcServiceDispatch(
        // @ts-expect-error for test
        environmentWithoutBinding,
        "ethang_courses",
        "courses",
        {}
      )
    ).rejects.toThrow("Invalid service");
  });
});
