import { beforeEach, describe, expect, it, vi } from "vitest";

import { addSubscriptionMutation } from "./add-subscription.ts";

const RSS_TITLE = "RSS Feed Title";
const RSS_WEBSITE = "https://rss-feed.com";
const RSS_XML = "https://rss-feed.com/feed.xml";

const mockContext = {
  user: {
    email: "user@test.com",
    exp: 123,
    iat: 123,
    sub: "user-1",
    username: "user1"
  }
};

const commonBeforeEach = () => {
  vi.restoreAllMocks();
};

describe("addSubscriptionMutation - RSS parsing", () => {
  beforeEach(() => {
    commonBeforeEach();
  });

  it("should parse RSS 2.0 feed and extract title and link", async () => {
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${RSS_TITLE}</title>
    <link>${RSS_WEBSITE}</link>
    <item>
      <title>Item 1</title>
    </item>
  </channel>
</rss>`;

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(rssXml, { status: 200 })
    );

    const mockFeedsInsertResult = {
      returning: vi.fn().mockResolvedValue([
        {
          id: "feed-rss-1",
          title: RSS_TITLE,
          website: RSS_WEBSITE,
          xmlAddress: RSS_XML
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
        xmlAddress: RSS_XML
      },
      mockContext
    );

    expect(result.title).toBe(RSS_TITLE);
    expect(result.website).toBe(RSS_WEBSITE);
  });

  it("should handle RSS feed with no items", async () => {
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Empty Feed</title>
    <link>https://empty-feed.com</link>
  </channel>
</rss>`;

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(rssXml, { status: 200 })
    );

    const mockFeedsInsertResult = {
      returning: vi.fn().mockResolvedValue([
        {
          id: "feed-rss-2",
          title: "Empty Feed",
          website: "https://empty-feed.com",
          xmlAddress: "https://empty-feed.com/feed.xml"
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
        xmlAddress: "https://empty-feed.com/feed.xml"
      },
      mockContext
    );

    expect(result.title).toBe("Empty Feed");
  });

  it("should handle RSS feed with various namespace extensions", async () => {
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Namespaced Feed</title>
    <link>https://namespaced-feed.com</link>
    <atom:link href="https://namespaced-feed.com/atom" rel="self"/>
    <item>
      <title>Item with dc</title>
      <dc:creator>Author</dc:creator>
    </item>
  </channel>
</rss>`;

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(rssXml, { status: 200 })
    );

    const mockFeedsInsertResult = {
      returning: vi.fn().mockResolvedValue([
        {
          id: "feed-rss-3",
          title: "Namespaced Feed",
          website: "https://namespaced-feed.com",
          xmlAddress: "https://namespaced-feed.com/feed.xml"
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
        xmlAddress: "https://namespaced-feed.com/feed.xml"
      },
      mockContext
    );

    expect(result.title).toBe("Namespaced Feed");
  });
});
