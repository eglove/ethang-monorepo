/* eslint-disable lodash/prefer-constant */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { addSubscriptionMutation } from "./add-subscription.ts";

const NETWORK_ERROR = "Network Error";

const FALLBACK_TITLE = "fallback.com";
const FALLBACK_WEBSITE = "https://fallback.com";
const FALLBACK_XML = "https://fallback.com/feed.xml";

const EXISTING_XML = "https://existing.com/feed.xml";

const NOTOK_XML = "https://notok.com/feed.xml";

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

    // @ts-expect-error test double
    const resolver = addSubscriptionMutation(mockDatabase);
    const result = await resolver(
      undefined,
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

    // @ts-expect-error test double
    const resolver = addSubscriptionMutation(mockDatabase);
    const result = await resolver(
      undefined,
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
    expect(mockDatabase.insert).toHaveBeenCalledTimes(1); // only for subscriptionsTable
  });

  it("should throw an error if inserting the feed fails", async () => {
    const mockFeedsInsertResult = {
      returning: vi.fn().mockResolvedValue([]), // returns empty array, simulating failure
      values: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      insert: vi.fn().mockReturnValue(mockFeedsInsertResult),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
      })
    };

    // @ts-expect-error test double
    const resolver = addSubscriptionMutation(mockDatabase);
    await expect(
      resolver(
        undefined,
        {
          xmlAddress: "https://website.com/feed.xml"
        },
        mockContext
      )
    ).rejects.toThrow("Unable to insert feed");
  });

  it("should fallback to empty strings if URL is invalid and fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error(NETWORK_ERROR));

    const mockFeedsInsertResult = {
      returning: vi.fn().mockResolvedValue([
        {
          id: "feed-invalid-url",
          title: "",
          website: "",
          xmlAddress: "invalid-url-format"
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

    // @ts-expect-error test double
    const resolver = addSubscriptionMutation(mockDatabase);
    const result = await resolver(
      undefined,
      {
        xmlAddress: "invalid-url-format"
      },
      mockContext
    );

    expect(result.title).toBe("");
    expect(result.website).toBe("");
  });

  it("should fallback to URL parsing if fetch returns not ok (e.g. 404)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      text: async () => {
        return "Not Found";
      }
    } as Response);

    const mockFeedsInsertResult = {
      returning: vi.fn().mockResolvedValue([
        {
          id: "feed-not-ok",
          title: "notok.com",
          website: "https://notok.com",
          xmlAddress: NOTOK_XML
        }
      ]),
      values: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      insert: vi
        .fn()
        .mockReturnValueOnce(mockFeedsInsertResult)
        .mockReturnValueOnce({
          onConflictDoNothing: vi.fn().mockResolvedValue({}),
          values: vi.fn().mockReturnThis()
        }),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
      })
    };

    // @ts-expect-error test double
    const resolver = addSubscriptionMutation(mockDatabase);
    const result = await resolver(
      undefined,
      {
        xmlAddress: NOTOK_XML
      },
      mockContext
    );

    expect(result.title).toBe("notok.com");
    expect(result.website).toBe("https://notok.com");
    expect(fetchSpy).toHaveBeenCalledWith(NOTOK_XML);
  });

  it("should handle XML with neither RSS nor Atom feed", async () => {
    const invalidXml = `
      <?xml version="1.0" encoding="utf-8"?>
      <notfeed>
        <title>Not Feed</title>
      </notfeed>
    `;

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => {
        return invalidXml;
      }
    } as Response);

    const mockFeedsInsertResult = {
      returning: vi.fn().mockResolvedValue([
        {
          id: "feed-not-rss-or-atom",
          title: "notrssoratom.com",
          website: "https://notrssoratom.com",
          xmlAddress: "https://notrssoratom.com/feed.xml"
        }
      ]),
      values: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      insert: vi
        .fn()
        .mockReturnValueOnce(mockFeedsInsertResult)
        .mockReturnValueOnce({
          onConflictDoNothing: vi.fn().mockResolvedValue({}),
          values: vi.fn().mockReturnThis()
        }),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
      })
    };

    // @ts-expect-error test double
    const resolver = addSubscriptionMutation(mockDatabase);
    const result = await resolver(
      undefined,
      {
        xmlAddress: "https://notrssoratom.com/feed.xml"
      },
      mockContext
    );

    expect(result.title).toBe("notrssoratom.com");
    expect(result.website).toBe("https://notrssoratom.com");
  });
});
