import isFunction from "lodash/isFunction.js";
import { Buffer } from "node:buffer";
import { describe, expect, it, vi } from "vitest";

import { MockQueryBuilder } from "../../test-utilities/mock-query-builder.ts";
import { subscriptionsQuery } from "./subscriptions.ts";

type Uint8ArrayConstructorWithBase64 = {
  fromBase64?: (base64: string) => Uint8Array;
} & typeof Uint8Array;

type Uint8ArrayWithBase64 = {
  toBase64?: () => string;
} & Uint8Array;

const lastFetchedAt1 = "2026-01-01T00:00:00.000Z";
const lastFetchedAt2 = "2026-01-02T00:00:00.000Z";
const website1 = "https://feed1.com";
const xmlAddress1 = "https://feed1.com/rss";
const website2 = "https://feed2.com";
const xmlAddress2 = "https://feed2.com/rss";

const publishedAt1 = "2026-06-15T10:00:00.000Z";
const publishedAt2 = "2026-06-15T09:00:00.000Z";

const FEED_ID_1 = "feed-1";
const FEED_ID_2 = "feed-2";
const FEED_ID_3 = "feed-3";
const SUB_ID_1 = "sub-1";
const SUB_ID_2 = "sub-2";
const SUB_ID_3 = "sub-3";

const FEED_NAME_1 = "Feed 1";
const FEED_NAME_2 = "Feed 2";
const FEED_NAME_A = "Feed A";
const FEED_NAME_B = "Feed B";

const mockUserContext = {
  feedLoader: {
    loadMany: vi.fn()
  },
  user: {
    sub: "user-1"
  }
};

/* eslint-disable unicorn/prefer-uint8array-base64 */
const encodeTestCursor = (value: [string, string]) => {
  const json = JSON.stringify(value);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(json) as Uint8ArrayWithBase64;

  if (isFunction(bytes.toBase64)) {
    return bytes.toBase64();
  }
  return Buffer.from(bytes).toString("base64");
};

const decodeTestCursor = (cursor: string) => {
  const ctor = Uint8Array as Uint8ArrayConstructorWithBase64;

  const bytes = isFunction(ctor.fromBase64)
    ? ctor.fromBase64(cursor)
    : new Uint8Array(Buffer.from(cursor, "base64"));
  const decoder = new TextDecoder();
  const json = decoder.decode(bytes);
  return JSON.parse(json) as [string, string];
};
/* eslint-enable unicorn/prefer-uint8array-base64 */

describe("subscriptionsQuery - default pagination", () => {
  it("should query subscriptions and return feed connections", async () => {
    const mockSubscriptions = [
      { feedId: FEED_ID_1, id: SUB_ID_1 },
      { feedId: FEED_ID_2, id: SUB_ID_2 }
    ];
    const mockFeeds = [
      {
        id: FEED_ID_1,
        lastFetchedAt: lastFetchedAt1,
        title: FEED_NAME_1,
        website: website1,
        xmlAddress: xmlAddress1
      },
      {
        id: FEED_ID_2,
        lastFetchedAt: lastFetchedAt2,
        title: FEED_NAME_2,
        website: website2,
        xmlAddress: xmlAddress2
      }
    ];

    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockSubscriptions),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    mockUserContext.feedLoader.loadMany.mockResolvedValue(mockFeeds);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);
    const result = await resolver(
      undefined,
      {},
      // @ts-expect-error test double
      mockUserContext
    );

    expect(result.edges).toHaveLength(2);
    expect(result.pageInfo.hasNextPage).toBe(false);
    expect(result.edges[0]?.cursor).toBe(SUB_ID_1);
    expect(result.edges[0]?.node.title).toBe(FEED_NAME_1);
    expect(result.pageInfo.startCursor).toBe(SUB_ID_1);
    expect(result.pageInfo.endCursor).toBe(SUB_ID_2);
  });

  it("should support after cursor and pagination limits", async () => {
    const mockSubscriptions = [
      { feedId: FEED_ID_1, id: SUB_ID_1 },
      { feedId: FEED_ID_2, id: SUB_ID_2 },
      { feedId: FEED_ID_3, id: SUB_ID_3 }
    ];
    const mockFeeds = [
      {
        id: FEED_ID_1,
        lastFetchedAt: lastFetchedAt1,
        title: FEED_NAME_1,
        website: website1,
        xmlAddress: xmlAddress1
      },
      {
        id: FEED_ID_2,
        lastFetchedAt: lastFetchedAt2,
        title: FEED_NAME_2,
        website: website2,
        xmlAddress: xmlAddress2
      }
    ];

    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockSubscriptions),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    mockUserContext.feedLoader.loadMany.mockResolvedValue(mockFeeds);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);
    const result = await resolver(
      undefined,
      { after: "sub-0", first: 2 },
      // @ts-expect-error test double
      mockUserContext
    );

    expect(result.edges).toHaveLength(2);
    expect(result.pageInfo.hasNextPage).toBe(true);
    expect(result.edges[0]?.cursor).toBe(SUB_ID_1);
    expect(result.pageInfo.endCursor).toBe(SUB_ID_2);
  });
});

describe("subscriptionsQuery - error handling", () => {
  it("should throw an error if feedLoader returns an Error instance", async () => {
    const mockSubscriptions = [{ feedId: FEED_ID_1, id: SUB_ID_1 }];
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockSubscriptions),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    mockUserContext.feedLoader.loadMany.mockResolvedValue([
      new Error("load failed")
    ]);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);

    await expect(
      resolver(
        undefined,
        {},
        // @ts-expect-error test double
        mockUserContext
      )
    ).rejects.toThrow("Unexpected error occurred.");
  });

  it("should throw an error if feedLoader returns a nullish value", async () => {
    const mockSubscriptions = [{ feedId: FEED_ID_1, id: SUB_ID_1 }];
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockSubscriptions),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    mockUserContext.feedLoader.loadMany.mockResolvedValue([null]);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);

    await expect(
      resolver(
        undefined,
        {},
        // @ts-expect-error test double
        mockUserContext
      )
    ).rejects.toThrow("Unexpected error occurred.");
  });

  it("should return empty connections if no subscriptions are returned", async () => {
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    mockUserContext.feedLoader.loadMany.mockResolvedValue([]);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);
    const result = await resolver(
      undefined,
      {},
      // @ts-expect-error test double
      mockUserContext
    );

    expect(result.edges).toHaveLength(0);
    expect(result.pageInfo.hasNextPage).toBe(false);
    expect(result.pageInfo.startCursor).toBeNull();
    expect(result.pageInfo.endCursor).toBeNull();
  });

  it("should handle missing subscription IDs or empty items gracefully", async () => {
    const mockSubscriptions = [{ feedId: FEED_ID_1 }];
    const mockFeeds = [
      {
        id: FEED_ID_1,
        lastFetchedAt: lastFetchedAt1,
        title: FEED_NAME_1,
        website: website1,
        xmlAddress: xmlAddress1
      },
      {
        id: FEED_ID_2,
        lastFetchedAt: lastFetchedAt2,
        title: FEED_NAME_2,
        website: website2,
        xmlAddress: xmlAddress2
      }
    ];

    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockSubscriptions),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    mockUserContext.feedLoader.loadMany.mockResolvedValue(mockFeeds);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);
    const result = await resolver(
      undefined,
      {},
      // @ts-expect-error test double
      mockUserContext
    );

    expect(result.edges).toHaveLength(2);
    expect(result.edges[0]?.cursor).toBe("");
    expect(result.edges[1]?.cursor).toBe("");
  });
});

describe("subscriptionsQuery - sorting by TITLE", () => {
  it("should support sorting by TITLE ASC with compound cursor pagination", async () => {
    const mockSubscriptions = [
      { feedId: FEED_ID_1, id: SUB_ID_1, title: FEED_NAME_A },
      { feedId: FEED_ID_2, id: SUB_ID_2, title: FEED_NAME_B }
    ];
    const mockFeeds = [
      {
        id: FEED_ID_1,
        lastFetchedAt: lastFetchedAt1,
        title: FEED_NAME_A,
        website: website1,
        xmlAddress: xmlAddress1
      },
      {
        id: FEED_ID_2,
        lastFetchedAt: lastFetchedAt2,
        title: FEED_NAME_B,
        website: website2,
        xmlAddress: xmlAddress2
      }
    ];

    const mockDatabase = new MockQueryBuilder(mockSubscriptions);
    mockUserContext.feedLoader.loadMany.mockResolvedValue(mockFeeds);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);

    const initialCursor = encodeTestCursor([FEED_NAME_A, SUB_ID_1]);

    const result = await resolver(
      undefined,
      {
        after: initialCursor,
        first: 2,
        sortBy: { direction: "ASC", field: "TITLE" }
      },
      // @ts-expect-error test double
      mockUserContext
    );

    expect(result.edges).toHaveLength(2);
    expect(decodeTestCursor(result.edges[0]?.cursor ?? "")).toEqual([
      FEED_NAME_A,
      SUB_ID_1
    ]);
    expect(decodeTestCursor(result.edges[1]?.cursor ?? "")).toEqual([
      FEED_NAME_B,
      SUB_ID_2
    ]);
  });

  it("should support sorting by TITLE DESC with compound cursor pagination", async () => {
    const mockSubscriptions = [
      { feedId: FEED_ID_1, id: SUB_ID_1, title: FEED_NAME_B },
      { feedId: FEED_ID_2, id: SUB_ID_2, title: FEED_NAME_A }
    ];
    const mockFeeds = [
      {
        id: FEED_ID_1,
        lastFetchedAt: lastFetchedAt1,
        title: FEED_NAME_B,
        website: website1,
        xmlAddress: xmlAddress1
      },
      {
        id: FEED_ID_2,
        lastFetchedAt: lastFetchedAt2,
        title: FEED_NAME_A,
        website: website2,
        xmlAddress: xmlAddress2
      }
    ];

    const mockDatabase = new MockQueryBuilder(mockSubscriptions);
    mockUserContext.feedLoader.loadMany.mockResolvedValue(mockFeeds);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);

    const initialCursor = encodeTestCursor([FEED_NAME_B, SUB_ID_1]);

    const result = await resolver(
      undefined,
      {
        after: initialCursor,
        first: 2,
        sortBy: { direction: "DESC", field: "TITLE" }
      },
      // @ts-expect-error test double
      mockUserContext
    );

    expect(result.edges).toHaveLength(2);
    expect(decodeTestCursor(result.edges[0]?.cursor ?? "")).toEqual([
      FEED_NAME_B,
      SUB_ID_1
    ]);
  });

  it("should fallback to empty string when title is missing in TITLE sorting", async () => {
    const mockSubscriptions = [
      { feedId: FEED_ID_1, id: undefined, title: undefined }
    ];
    const mockFeeds = [
      {
        id: FEED_ID_1,
        lastFetchedAt: lastFetchedAt1,
        title: FEED_NAME_A,
        website: website1,
        xmlAddress: xmlAddress1
      }
    ];

    const mockDatabase = new MockQueryBuilder(mockSubscriptions);
    mockUserContext.feedLoader.loadMany.mockResolvedValue(mockFeeds);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);

    const result = await resolver(
      undefined,
      {
        first: 1,
        sortBy: { direction: "ASC", field: "TITLE" }
      },
      // @ts-expect-error test double
      mockUserContext
    );

    expect(result.edges).toHaveLength(1);
    expect(decodeTestCursor(result.edges[0]?.cursor ?? "")).toEqual(["", ""]);
  });

  it("should handle invalid base64 cursor gracefully when sortBy is active", async () => {
    const mockSubscriptions = [
      { feedId: FEED_ID_1, id: SUB_ID_1, title: FEED_NAME_A }
    ];
    const mockFeeds = [
      {
        id: FEED_ID_1,
        lastFetchedAt: lastFetchedAt1,
        title: FEED_NAME_A,
        website: website1,
        xmlAddress: xmlAddress1
      }
    ];

    const mockDatabase = new MockQueryBuilder(mockSubscriptions);
    mockUserContext.feedLoader.loadMany.mockResolvedValue(mockFeeds);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);

    const result = await resolver(
      undefined,
      {
        after: "invalid-base64-not-json!!",
        first: 1,
        sortBy: { direction: "ASC", field: "TITLE" }
      },
      // @ts-expect-error test double
      mockUserContext
    );

    expect(result.edges).toHaveLength(1);
    expect(decodeTestCursor(result.edges[0]?.cursor ?? "")).toEqual([
      FEED_NAME_A,
      SUB_ID_1
    ]);
  });

  it("should handle valid base64 but non-array JSON cursor gracefully", async () => {
    const mockSubscriptions = [
      { feedId: FEED_ID_1, id: SUB_ID_1, title: FEED_NAME_A }
    ];
    const mockFeeds = [
      {
        id: FEED_ID_1,
        lastFetchedAt: lastFetchedAt1,
        title: FEED_NAME_A,
        website: website1,
        xmlAddress: xmlAddress1
      }
    ];

    const mockDatabase = new MockQueryBuilder(mockSubscriptions);
    mockUserContext.feedLoader.loadMany.mockResolvedValue(mockFeeds);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);

    const encoder = new TextEncoder();
    const bytes = encoder.encode('{"feedId":"sub-1"}');

    /* eslint-disable unicorn/prefer-uint8array-base64 */

    const invalidCursor = isFunction(bytes.toBase64)
      ? bytes.toBase64()
      : Buffer.from(bytes).toString("base64");
    /* eslint-enable unicorn/prefer-uint8array-base64 */

    const result = await resolver(
      undefined,
      {
        after: invalidCursor,
        first: 1,
        sortBy: { direction: "ASC", field: "TITLE" }
      },
      // @ts-expect-error test double
      mockUserContext
    );

    expect(result.edges).toHaveLength(1);
    expect(decodeTestCursor(result.edges[0]?.cursor ?? "")).toEqual([
      FEED_NAME_A,
      SUB_ID_1
    ]);
  });
});

describe("subscriptionsQuery - sorting by PUBLISHED_AT", () => {
  it("should support sorting by PUBLISHED_AT DESC with compound cursor pagination", async () => {
    const mockSubscriptions = [
      {
        feedId: FEED_ID_1,
        id: SUB_ID_1,
        maxPublishedAt: publishedAt1
      },
      {
        feedId: FEED_ID_2,
        id: SUB_ID_2,
        maxPublishedAt: publishedAt2
      }
    ];
    const mockFeeds = [
      {
        id: FEED_ID_1,
        lastFetchedAt: lastFetchedAt1,
        title: FEED_NAME_A,
        website: website1,
        xmlAddress: xmlAddress1
      },
      {
        id: FEED_ID_2,
        lastFetchedAt: lastFetchedAt2,
        title: FEED_NAME_B,
        website: website2,
        xmlAddress: xmlAddress2
      }
    ];

    const mockDatabase = new MockQueryBuilder(mockSubscriptions);
    mockUserContext.feedLoader.loadMany.mockResolvedValue(mockFeeds);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);

    const result = await resolver(
      undefined,
      {
        first: 2,
        sortBy: { direction: "DESC", field: "PUBLISHED_AT" }
      },
      // @ts-expect-error test double
      mockUserContext
    );

    expect(result.edges).toHaveLength(2);
    expect(decodeTestCursor(result.edges[0]?.cursor ?? "")).toEqual([
      publishedAt1,
      SUB_ID_1
    ]);
  });

  it("should support sorting by PUBLISHED_AT DESC with a valid cursor after", async () => {
    const mockSubscriptions = [
      {
        feedId: FEED_ID_1,
        id: SUB_ID_1,
        maxPublishedAt: publishedAt2
      }
    ];
    const mockFeeds = [
      {
        id: FEED_ID_1,
        lastFetchedAt: lastFetchedAt1,
        title: FEED_NAME_A,
        website: website1,
        xmlAddress: xmlAddress1
      }
    ];

    const mockDatabase = new MockQueryBuilder(mockSubscriptions);
    mockUserContext.feedLoader.loadMany.mockResolvedValue(mockFeeds);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);
    const initialCursor = encodeTestCursor([publishedAt1, "sub-0"]);

    const result = await resolver(
      undefined,
      {
        after: initialCursor,
        first: 1,
        sortBy: { direction: "DESC", field: "PUBLISHED_AT" }
      },
      // @ts-expect-error test double
      mockUserContext
    );

    expect(result.edges).toHaveLength(1);
    expect(decodeTestCursor(result.edges[0]?.cursor ?? "")).toEqual([
      publishedAt2,
      SUB_ID_1
    ]);
  });

  it("should support sorting by PUBLISHED_AT ASC with compound cursor pagination", async () => {
    const mockSubscriptions = [
      {
        feedId: FEED_ID_1,
        id: SUB_ID_1,
        maxPublishedAt: publishedAt2
      },
      {
        feedId: FEED_ID_2,
        id: SUB_ID_2,
        maxPublishedAt: publishedAt1
      }
    ];
    const mockFeeds = [
      {
        id: FEED_ID_1,
        lastFetchedAt: lastFetchedAt1,
        title: FEED_NAME_A,
        website: website1,
        xmlAddress: xmlAddress1
      },
      {
        id: FEED_ID_2,
        lastFetchedAt: lastFetchedAt2,
        title: FEED_NAME_B,
        website: website2,
        xmlAddress: xmlAddress2
      }
    ];

    const mockDatabase = new MockQueryBuilder(mockSubscriptions);
    mockUserContext.feedLoader.loadMany.mockResolvedValue(mockFeeds);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);

    const initialCursor = encodeTestCursor([publishedAt2, SUB_ID_1]);

    const result = await resolver(
      undefined,
      {
        after: initialCursor,
        first: 2,
        sortBy: { direction: "ASC", field: "PUBLISHED_AT" }
      },
      // @ts-expect-error test double
      mockUserContext
    );

    expect(result.edges).toHaveLength(2);
    expect(decodeTestCursor(result.edges[0]?.cursor ?? "")).toEqual([
      publishedAt2,
      SUB_ID_1
    ]);
  });

  it("should fallback to empty string when maxPublishedAt is missing in PUBLISHED_AT sorting", async () => {
    const mockSubscriptions = [
      { feedId: FEED_ID_1, id: undefined, maxPublishedAt: undefined }
    ];
    const mockFeeds = [
      {
        id: FEED_ID_1,
        lastFetchedAt: lastFetchedAt1,
        title: FEED_NAME_A,
        website: website1,
        xmlAddress: xmlAddress1
      }
    ];

    const mockDatabase = new MockQueryBuilder(mockSubscriptions);
    mockUserContext.feedLoader.loadMany.mockResolvedValue(mockFeeds);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);

    const result = await resolver(
      undefined,
      {
        first: 1,
        sortBy: { direction: "DESC", field: "PUBLISHED_AT" }
      },
      // @ts-expect-error test double
      mockUserContext
    );

    expect(result.edges).toHaveLength(1);
    expect(decodeTestCursor(result.edges[0]?.cursor ?? "")).toEqual(["", ""]);
  });
});

describe("subscriptionsQuery - environment fallbacks and invalid inputs", () => {
  it("should handle non-string cursor gracefully when sortBy is active", async () => {
    const mockSubscriptions = [
      { feedId: FEED_ID_1, id: SUB_ID_1, title: FEED_NAME_A }
    ];
    const mockFeeds = [
      {
        id: FEED_ID_1,
        lastFetchedAt: lastFetchedAt1,
        title: FEED_NAME_A,
        website: website1,
        xmlAddress: xmlAddress1
      }
    ];

    const mockDatabase = new MockQueryBuilder(mockSubscriptions);
    mockUserContext.feedLoader.loadMany.mockResolvedValue(mockFeeds);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);

    const result = await resolver(
      undefined,
      {
        after: 123 as any,
        first: 1,
        sortBy: { direction: "ASC", field: "TITLE" }
      },
      // @ts-expect-error test double
      mockUserContext
    );

    expect(result.edges).toHaveLength(1);
  });

  it("should use native Uint8Array base64 methods if available", async () => {
    /* eslint-disable no-extend-native, unicorn/prefer-uint8array-base64 */
    const originalToBase64 = (Uint8Array.prototype as any).toBase64;
    const originalFromBase64 = (Uint8Array as any).fromBase64;

    Object.defineProperty(Uint8Array.prototype, "toBase64", {
      configurable: true,
      value: () => {
        return Buffer.from('["Feed A","sub-1"]').toString("base64");
      },
      writable: true
    });

    Object.defineProperty(Uint8Array, "fromBase64", {
      configurable: true,
      value: (base64: string) => {
        return new Uint8Array(Buffer.from(base64, "base64"));
      },
      writable: true
    });

    try {
      const mockSubscriptions = [
        { feedId: FEED_ID_1, id: SUB_ID_1, title: FEED_NAME_A }
      ];
      const mockFeeds = [
        {
          id: FEED_ID_1,
          lastFetchedAt: lastFetchedAt1,
          title: FEED_NAME_A,
          website: website1,
          xmlAddress: xmlAddress1
        }
      ];

      const mockDatabase = new MockQueryBuilder(mockSubscriptions);
      mockUserContext.feedLoader.loadMany.mockResolvedValue(mockFeeds);

      // @ts-expect-error test double
      const resolver = subscriptionsQuery(mockDatabase);

      const cursor = encodeTestCursor(["Feed A", "sub-1"]);

      const result = await resolver(
        undefined,
        {
          after: cursor,
          first: 1,
          sortBy: { direction: "ASC", field: "TITLE" }
        },
        // @ts-expect-error test double
        mockUserContext
      );

      expect(result.edges).toHaveLength(1);
    } finally {
      if (undefined === originalToBase64) {
        delete (Uint8Array.prototype as any).toBase64;
      } else {
        (Uint8Array.prototype as any).toBase64 = originalToBase64;
      }

      if (undefined === originalFromBase64) {
        delete (Uint8Array as any).fromBase64;
      } else {
        (Uint8Array as any).fromBase64 = originalFromBase64;
      }
    }
    /* eslint-enable no-extend-native, unicorn/prefer-uint8array-base64 */
  });

  it("should handle valid base64 array cursor with non-string elements gracefully", async () => {
    const mockSubscriptions = [
      { feedId: FEED_ID_1, id: SUB_ID_1, title: FEED_NAME_A }
    ];
    const mockFeeds = [
      {
        id: FEED_ID_1,
        lastFetchedAt: lastFetchedAt1,
        title: FEED_NAME_A,
        website: website1,
        xmlAddress: xmlAddress1
      }
    ];

    const mockDatabase = new MockQueryBuilder(mockSubscriptions);
    mockUserContext.feedLoader.loadMany.mockResolvedValue(mockFeeds);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);

    const encoder = new TextEncoder();
    const bytes = encoder.encode("[1, 2]");
    /* eslint-disable unicorn/prefer-uint8array-base64 */

    const invalidCursor = isFunction(bytes.toBase64)
      ? bytes.toBase64()
      : Buffer.from(bytes).toString("base64");
    /* eslint-enable unicorn/prefer-uint8array-base64 */

    const result = await resolver(
      undefined,
      {
        after: invalidCursor,
        first: 1,
        sortBy: { direction: "ASC", field: "TITLE" }
      },
      // @ts-expect-error test double
      mockUserContext
    );

    expect(result.edges).toHaveLength(1);
  });
});
