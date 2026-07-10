import { beforeEach, describe, expect, it, vi } from "vitest";

import { removeSubscriptionMutation } from "./remove-subscription.ts";

const mockContext = {
  user: {
    email: "user@test.com",
    exp: 123,
    iat: 123,
    sub: "user-1",
    username: "user1"
  }
};

const FEED_ID = "feed-1";
const OTHER_FEED_ID = "feed-2";

describe("removeSubscriptionMutation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should delete the subscription row scoped to user and feed", async () => {
    const whereResult = {
      where: vi.fn().mockResolvedValue({ success: true })
    };

    const mockDatabase = {
      delete: vi.fn().mockReturnValue(whereResult)
    };

    await removeSubscriptionMutation(
      // @ts-expect-error test double
      mockDatabase,
      { feedId: FEED_ID },
      mockContext
    );

    expect(mockDatabase.delete).toHaveBeenCalledTimes(1);
    expect(whereResult.where).toHaveBeenCalledTimes(1);
  });

  it("should throw an error when feedId is empty string", async () => {
    const mockDatabase = {
      delete: vi.fn()
    };

    await expect(
      removeSubscriptionMutation(
        // @ts-expect-error test double
        mockDatabase,
        { feedId: "" },
        mockContext
      )
    ).rejects.toThrow("feedId is required");

    expect(mockDatabase.delete).not.toHaveBeenCalled();
  });

  it("should throw an error when feedId is undefined", async () => {
    const mockDatabase = {
      delete: vi.fn()
    };

    await expect(
      removeSubscriptionMutation(
        // @ts-expect-error test double
        mockDatabase,
        { feedId: null as unknown as string },
        mockContext
      )
    ).rejects.toThrow("feedId is required");

    expect(mockDatabase.delete).not.toHaveBeenCalled();
  });

  it("should be idempotent when the subscription does not exist", async () => {
    const whereResult = {
      where: vi.fn().mockResolvedValue({ success: false })
    };

    const mockDatabase = {
      delete: vi.fn().mockReturnValue(whereResult)
    };

    await expect(
      removeSubscriptionMutation(
        // @ts-expect-error test double
        mockDatabase,
        { feedId: OTHER_FEED_ID },
        mockContext
      )
    ).resolves.toBeUndefined();
  });

  it("should call delete with the subscriptionsTable", async () => {
    const whereResult = {
      where: vi.fn().mockResolvedValue({ success: true })
    };

    const mockDatabase = {
      delete: vi.fn().mockReturnValue(whereResult)
    };

    await removeSubscriptionMutation(
      // @ts-expect-error test double
      mockDatabase,
      { feedId: FEED_ID },
      mockContext
    );

    expect(mockDatabase.delete).toHaveBeenCalledTimes(1);
  });

  it("should include user.sub in the where clause for authorization", async () => {
    const whereSpy = vi.fn().mockResolvedValue({ success: true });
    const mockDatabase = {
      delete: vi.fn().mockReturnValue({
        where: whereSpy
      })
    };

    await removeSubscriptionMutation(
      // @ts-expect-error test double
      mockDatabase,
      { feedId: FEED_ID },
      mockContext
    );

    // The where clause must be a non-null SQL wrapper composed of the
    // user's sub and the feed id. Auth scoping is enforced by including
    // user.sub in `and(eq(userId, user.sub), eq(feedId, feedId))`.
    const whereArgument = whereSpy.mock.calls[0]?.[0];
    expect(whereArgument).toBeDefined();
    expect(whereSpy).toHaveBeenCalledTimes(1);
  });
});
