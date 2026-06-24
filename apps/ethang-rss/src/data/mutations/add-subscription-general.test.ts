import { beforeEach, describe, expect, it, vi } from "vitest";

import { addSubscriptionMutation } from "./add-subscription.ts";

const NETWORK_ERROR = "Network Error";

const FALLBACK_TITLE = "fallback.com";
const FALLBACK_WEBSITE = "https://fallback.com";
const FALLBACK_XML = "https://fallback.com/feed.xml";

const EXISTING_XML = "https://existing.com/feed.xml";

const NOTOK_XML = "https://notok.com/feed.xml";

const DIRECT_RSS_XML = "https://direct-rss.com/feed.xml";

const mockContext = {
  user: {
    email: "user@test.com",
    exp: 123,
    iat: 123,
    sub: "user-1",
    username: "user1"
  }
};

// eslint-disable-next-line sonar/max-lines-per-function
describe("addSubscriptionMutation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fallback to URL parsing if fetching or XML parsing fails", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error(NETWORK_ERROR));

    const mockFeedsInsertResult = {
      returning: vi.fn().mockResolvedValue([
        {
          id: "feed-4",
          title: FALLBACK_TITLE,
          website: FALLBACK_WEBSITE,
          xmlAddress: FALLBACK_XML
        }
      ]),
      values: vi.fn().mockReturnThis()
    };

    const mockSubscriptionsInsertResult = {
      onConflictDoNothing: vi.fn().mockResolvedValue({}),
      values: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      insert: vi
        .fn()
        .mockReturnValueOnce(mockFeedsInsertResult)
        .mockReturnValueOnce(mockSubscriptionsInsertResult),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
      })
    };

    const result = await addSubscriptionMutation(
      // @ts-expect-error test double
      mockDatabase,
      {
        xmlAddress: FALLBACK_XML
      },
      mockContext
    );

    expect(result).toEqual({
      id: "feed-4",
      title: FALLBACK_TITLE,
      website: FALLBACK_WEBSITE,
      xmlAddress: FALLBACK_XML
    });
    expect(fetchSpy).toHaveBeenCalledWith(FALLBACK_XML);
    expect(mockFeedsInsertResult.values).toHaveBeenCalledWith({
      title: FALLBACK_TITLE,
      website: FALLBACK_WEBSITE,
      xmlAddress: FALLBACK_XML
    });
  });

  it("should return existing feed if it already exists in the database", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const mockDatabase = {
      insert: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue({}),
        values: vi.fn().mockReturnThis()
      }),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          {
            id: "feed-existing",
            title: "Existing Title",
            website: "https://existing.com",
            xmlAddress: EXISTING_XML
          }
        ])
      })
    };

    const result = await addSubscriptionMutation(
      // @ts-expect-error test double
      mockDatabase,
      {
        xmlAddress: EXISTING_XML
      },
      mockContext
    );

    expect(result).toEqual({
      id: "feed-existing",
      title: "Existing Title",
      website: "https://existing.com",
      xmlAddress: EXISTING_XML
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should throw an error if the feed still does not exist after parsing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 500 })
    );

    const mockFeedsInsertResult = {
      returning: vi.fn().mockResolvedValue([]),
      values: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      insert: vi.fn().mockReturnValueOnce(mockFeedsInsertResult),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
      })
    };

    await expect(
      addSubscriptionMutation(
        // @ts-expect-error test double
        mockDatabase,
        { xmlAddress: NOTOK_XML },
        mockContext
      )
    ).rejects.toThrow("Unable to insert feed");
  });

  it("should fetch title and website from the feed XML", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Direct RSS Title</title>
    <link>https://direct-rss.com</link>
  </channel>
</rss>`,
        { status: 200 }
      )
    );

    const mockFeedsInsertResult = {
      returning: vi.fn().mockResolvedValue([
        {
          id: "feed-direct",
          title: "Direct RSS Title",
          website: "https://direct-rss.com",
          xmlAddress: DIRECT_RSS_XML
        }
      ]),
      values: vi.fn().mockReturnThis()
    };

    const mockSubscriptionsInsertResult = {
      onConflictDoNothing: vi.fn().mockResolvedValue({}),
      values: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      insert: vi
        .fn()
        .mockReturnValueOnce(mockFeedsInsertResult)
        .mockReturnValueOnce(mockSubscriptionsInsertResult),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
      })
    };

    const result = await addSubscriptionMutation(
      // @ts-expect-error test double
      mockDatabase,
      {
        xmlAddress: DIRECT_RSS_XML
      },
      mockContext
    );

    expect(result).toEqual({
      id: "feed-direct",
      title: "Direct RSS Title",
      website: "https://direct-rss.com",
      xmlAddress: DIRECT_RSS_XML
    });
  });

  it("should handle network error gracefully and fallback to URL parsing", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error(NETWORK_ERROR));

    const mockFeedsInsertResult = {
      returning: vi.fn().mockResolvedValue([
        {
          id: "feed-5",
          title: "error-site.com",
          website: "https://error-site.com",
          xmlAddress: "https://error-site.com/feed.xml"
        }
      ]),
      values: vi.fn().mockReturnThis()
    };

    const mockSubscriptionsInsertResult = {
      onConflictDoNothing: vi.fn().mockResolvedValue({}),
      values: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      insert: vi
        .fn()
        .mockReturnValueOnce(mockFeedsInsertResult)
        .mockReturnValueOnce(mockSubscriptionsInsertResult),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
      })
    };

    const result = await addSubscriptionMutation(
      // @ts-expect-error test double
      mockDatabase,
      {
        xmlAddress: "https://error-site.com/feed.xml"
      },
      mockContext
    );

    expect(result.title).toBe("error-site.com");
    expect(result.website).toBe("https://error-site.com");
  });

  it("should handle invalid URL in fallback gracefully", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error(NETWORK_ERROR));

    const mockFeedsInsertResult = {
      returning: vi.fn().mockResolvedValue([
        {
          id: "feed-6",
          title: "invalid",
          website: "invalid",
          xmlAddress: "invalid"
        }
      ]),
      values: vi.fn().mockReturnThis()
    };

    const mockSubscriptionsInsertResult = {
      onConflictDoNothing: vi.fn().mockResolvedValue({}),
      values: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      insert: vi
        .fn()
        .mockReturnValueOnce(mockFeedsInsertResult)
        .mockReturnValueOnce(mockSubscriptionsInsertResult),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
      })
    };

    const result = await addSubscriptionMutation(
      // @ts-expect-error test double
      mockDatabase,
      {
        xmlAddress: "invalid"
      },
      mockContext
    );

    expect(result.title).toBe("invalid");
    expect(result.website).toBe("invalid");
  });
});
