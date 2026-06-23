import replace from "lodash/replace.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { addSubscriptionMutation } from "./add-subscription.ts";

const ATOM_TITLE = "Atom Feed Title";
const ATOM_WEBSITE = "https://atom-feed.com";
const ATOM_XML = "https://atom-feed.com/feed.xml";

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

const createMockFeedsInsertResult = (returnValue: object[]) => {
  return {
    returning: vi.fn().mockResolvedValue(returnValue),
    values: vi.fn().mockReturnThis()
  };
};

const createMockDatabase = (
  feedsInsertResult: ReturnType<typeof createMockFeedsInsertResult>,
  selectWhereResult: object[]
) => {
  const mockSubscriptionsInsertResult = {
    onConflictDoNothing: vi.fn().mockResolvedValue({}),
    values: vi.fn().mockReturnThis()
  };

  return {
    insert: vi
      .fn()
      .mockReturnValueOnce(feedsInsertResult)
      .mockReturnValueOnce(mockSubscriptionsInsertResult),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(selectWhereResult)
    })
  };
};

describe("addSubscriptionMutation - Atom parsing", () => {
  beforeEach(() => {
    commonBeforeEach();
  });

  it("should parse Atom feed and extract title and website", async () => {
    const atomXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${ATOM_TITLE}</title>
  <link href="${ATOM_WEBSITE}" rel="alternate"/>
  <entry>
    <title>Entry 1</title>
  </entry>
</feed>`;

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(atomXml, { status: 200 })
    );

    const mockFeedsInsertResult = createMockFeedsInsertResult([
      {
        id: "feed-atom-1",
        title: ATOM_TITLE,
        website: ATOM_WEBSITE,
        xmlAddress: ATOM_XML
      }
    ]);

    const mockDatabase = createMockDatabase(mockFeedsInsertResult, []);

    const result = await addSubscriptionMutation(
      // @ts-expect-error test double
      mockDatabase,
      {
        xmlAddress: ATOM_XML
      },
      mockContext
    );

    expect(result.title).toBe(ATOM_TITLE);
    expect(result.website).toBe(ATOM_WEBSITE);
  });

  it("should handle Atom feed with multiple link elements", async () => {
    const atomXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${ATOM_TITLE}</title>
  <link href="${ATOM_WEBSITE}" rel="alternate"/>
  <link href="https://atom-feed.com/other" rel="self"/>
  <entry>
    <title>Entry 1</title>
  </entry>
</feed>`;

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(atomXml, { status: 200 })
    );

    const mockFeedsInsertResult = createMockFeedsInsertResult([
      {
        id: "feed-atom-2",
        title: ATOM_TITLE,
        website: ATOM_WEBSITE,
        xmlAddress: ATOM_XML
      }
    ]);

    const mockDatabase = createMockDatabase(mockFeedsInsertResult, []);

    const result = await addSubscriptionMutation(
      // @ts-expect-error test double
      mockDatabase,
      {
        xmlAddress: ATOM_XML
      },
      mockContext
    );

    expect(result.website).toBe(ATOM_WEBSITE);
  });

  it("should handle Atom feed without a link with rel=alternate by using any http link", async () => {
    const atomXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>No Alternate Title</title>
  <link href="https://no-alternate.com" rel="self"/>
  <entry>
    <title>Entry 1</title>
  </entry>
</feed>`;

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(atomXml, { status: 200 })
    );

    const mockFeedsInsertResult = createMockFeedsInsertResult([
      {
        id: "feed-atom-3",
        title: "No Alternate Title",
        website: "https://no-alternate.com",
        xmlAddress: "https://no-alternate.com/feed.xml"
      }
    ]);

    const mockDatabase = createMockDatabase(mockFeedsInsertResult, []);

    const result = await addSubscriptionMutation(
      // @ts-expect-error test double
      mockDatabase,
      {
        xmlAddress: "https://no-alternate.com/feed.xml"
      },
      mockContext
    );

    expect(result.website).toBe("https://no-alternate.com");
  });

  it("should handle Atom feed with no title element", async () => {
    const atomXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <link href="${ATOM_WEBSITE}" rel="alternate"/>
  <entry>
    <title>Entry 1</title>
  </entry>
</feed>`;

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(atomXml, { status: 200 })
    );

    const mockFeedsInsertResult = createMockFeedsInsertResult([
      {
        id: "feed-atom-4",
        title: replace(ATOM_WEBSITE, "https://", ""),
        website: ATOM_WEBSITE,
        xmlAddress: ATOM_XML
      }
    ]);

    const mockDatabase = createMockDatabase(mockFeedsInsertResult, []);

    const result = await addSubscriptionMutation(
      // @ts-expect-error test double
      mockDatabase,
      {
        xmlAddress: ATOM_XML
      },
      mockContext
    );

    expect(result.website).toBe(ATOM_WEBSITE);
  });

  it("should handle Atom feed with no link element", async () => {
    const atomXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>No Link Title</title>
  <entry>
    <title>Entry 1</title>
  </entry>
</feed>`;

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(atomXml, { status: 200 })
    );

    const mockFeedsInsertResult = createMockFeedsInsertResult([
      {
        id: "feed-atom-5",
        title: "No Link Title",
        website: "no-link-title",
        xmlAddress: "https://no-link-title/feed.xml"
      }
    ]);

    const mockDatabase = createMockDatabase(mockFeedsInsertResult, []);

    const result = await addSubscriptionMutation(
      // @ts-expect-error test double
      mockDatabase,
      {
        xmlAddress: "https://no-link-title/feed.xml"
      },
      mockContext
    );

    // The exact results depend on parseFeedMetadata behavior - just ensure it doesn't crash
    expect(result).toBeDefined();
    expect(result.title).toBeDefined();
  });
});
