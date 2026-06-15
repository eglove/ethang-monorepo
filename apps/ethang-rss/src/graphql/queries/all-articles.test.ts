/* eslint-disable unicorn/prefer-uint8array-base64, unicorn/no-this-outside-of-class */
import isFunction from "lodash/isFunction.js";
import { Buffer } from "node:buffer";
import { describe, expect, it, vi } from "vitest";

import { allArticlesQuery } from "./all-articles.ts";

type Uint8ArrayWithBase64 = {
  toBase64?: () => string;
} & Uint8Array;

const FEED_ID_1 = "feed-1";
const FEED_ID_2 = "feed-2";
const USER_ID_1 = "user-1";
const PUBLISHED_AT_1 = "2026-06-15T10:00:00.000Z";
const PUBLISHED_AT_2 = "2026-06-15T09:00:00.000Z";
const ARTICLE_TITLE_1 = "Article 1";
const ARTICLE_TITLE_2 = "Article 2";

const encodeCursor = (value: [null | string, string]) => {
  const json = JSON.stringify(value);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(json) as Uint8ArrayWithBase64;

  if (isFunction(bytes.toBase64)) {
    return bytes.toBase64();
  }
  return Buffer.from(bytes).toString("base64");
};

const mockContext = {
  user: {
    email: "user@test.com",
    exp: 123,
    iat: 123,
    sub: USER_ID_1,
    username: "user1"
  }
};

describe("allArticlesQuery - basic query path", () => {
  it("should query articles and return flat connection (simple path, no filters, no after)", async () => {
    const mockArticles = [
      {
        feedId: FEED_ID_1,
        id: "1",
        publishedAt: PUBLISHED_AT_1,
        title: ARTICLE_TITLE_1
      },
      {
        feedId: FEED_ID_2,
        id: "2",
        publishedAt: PUBLISHED_AT_2,
        title: ARTICLE_TITLE_2
      }
    ];

    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockArticles),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    // @ts-expect-error test double
    const resolver = allArticlesQuery(mockDatabase);
    const result = await resolver(
      undefined,
      { first: 2 },
      // @ts-expect-error test double
      mockContext
    );

    expect(result.edges.length).toBe(2);
    expect(result.pageInfo.hasNextPage).toBe(false);
    expect(result.edges[0]?.node.title).toBe(ARTICLE_TITLE_1);
    expect(result.edges[0]?.cursor).toBe(encodeCursor([PUBLISHED_AT_1, "1"]));
  });
});

describe("allArticlesQuery - filtering", () => {
  it("should filter by isRead = true", async () => {
    const mockArticles = [
      {
        feedId: FEED_ID_1,
        id: "1",
        publishedAt: PUBLISHED_AT_1,
        title: ARTICLE_TITLE_1
      }
    ];
    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnValue({})
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue(mockArticles),
          orderBy: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis()
        })
    };

    // @ts-expect-error test double
    const resolver = allArticlesQuery(mockDatabase);
    const result = await resolver(
      undefined,
      { isRead: true },
      // @ts-expect-error test double
      mockContext
    );

    expect(result.edges.length).toBe(1);
    expect(mockDatabase.select).toHaveBeenCalledTimes(2);
  });

  it("should filter by isRead = false", async () => {
    const mockArticles = [
      {
        feedId: FEED_ID_1,
        id: "1",
        publishedAt: PUBLISHED_AT_1,
        title: ARTICLE_TITLE_1
      }
    ];
    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnValue({})
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue(mockArticles),
          orderBy: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis()
        })
    };

    // @ts-expect-error test double
    const resolver = allArticlesQuery(mockDatabase);
    const result = await resolver(
      undefined,
      { isRead: false },
      // @ts-expect-error test double
      mockContext
    );

    expect(result.edges.length).toBe(1);
    expect(mockDatabase.select).toHaveBeenCalledTimes(2);
  });
});

describe("allArticlesQuery - pagination and cursors", () => {
  it("should handle after cursor and hasNextPage = true", async () => {
    const mockArticles = [
      {
        feedId: FEED_ID_1,
        id: "2",
        publishedAt: PUBLISHED_AT_2,
        title: ARTICLE_TITLE_2
      },
      {
        feedId: FEED_ID_1,
        id: "1",
        publishedAt: "2026-06-15T08:00:00.000Z",
        title: ARTICLE_TITLE_1
      }
    ];

    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockArticles),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    // @ts-expect-error test double
    const resolver = allArticlesQuery(mockDatabase);
    const result = await resolver(
      undefined,
      {
        after: encodeCursor([PUBLISHED_AT_1, "3"]),
        first: 1
      },
      // @ts-expect-error test double
      mockContext
    );

    expect(result.edges.length).toBe(1);
    expect(result.pageInfo.hasNextPage).toBe(true);
    expect(result.edges[0]?.node.id).toBe("2");
  });

  it("should handle cursor with null publishedAt", async () => {
    const mockArticles = [
      {
        feedId: FEED_ID_1,
        id: "1",
        publishedAt: null,
        title: ARTICLE_TITLE_1
      }
    ];
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockArticles),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    // @ts-expect-error test double
    const resolver = allArticlesQuery(mockDatabase);
    const result = await resolver(
      undefined,
      {
        after: encodeCursor([null, "3"]),
        first: 1
      },
      // @ts-expect-error test double
      mockContext
    );
    expect(result.edges.length).toBe(1);
  });
});

describe("allArticlesQuery - validation error paths", () => {
  it("should handle invalid base64 cursor", async () => {
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };
    // @ts-expect-error test double
    const resolver = allArticlesQuery(mockDatabase);
    const result = await resolver(
      undefined,
      { after: "invalid-base64!!" },
      // @ts-expect-error test double
      mockContext
    );
    expect(result.edges.length).toBe(0);
  });

  it("should handle invalid JSON in cursor", async () => {
    const invalidJsonBase64 = Buffer.from("abc{").toString("base64");
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };
    // @ts-expect-error test double
    const resolver = allArticlesQuery(mockDatabase);
    const result = await resolver(
      undefined,
      { after: invalidJsonBase64 },
      // @ts-expect-error test double
      mockContext
    );
    expect(result.edges.length).toBe(0);
  });

  it("should handle invalid cursor array shape", async () => {
    const invalidShapeBase64 = Buffer.from(
      JSON.stringify(["only-one-item"])
    ).toString("base64");
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };
    // @ts-expect-error test double
    const resolver = allArticlesQuery(mockDatabase);
    const result = await resolver(
      undefined,
      { after: invalidShapeBase64 },
      // @ts-expect-error test double
      mockContext
    );
    expect(result.edges.length).toBe(0);
  });

  it("should handle cursor array where first element is not a string or null", async () => {
    const invalidElementBase64 = Buffer.from(
      JSON.stringify([123, "some-id"])
    ).toString("base64");
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };
    // @ts-expect-error test double
    const resolver = allArticlesQuery(mockDatabase);
    const result = await resolver(
      undefined,
      { after: invalidElementBase64 },
      // @ts-expect-error test double
      mockContext
    );
    expect(result.edges.length).toBe(0);
  });

  it("should handle cursor array where second element is not a string", async () => {
    const invalidSecondBase64 = Buffer.from(
      JSON.stringify(["published-at", 123])
    ).toString("base64");
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };
    // @ts-expect-error test double
    const resolver = allArticlesQuery(mockDatabase);
    const result = await resolver(
      undefined,
      { after: invalidSecondBase64 },
      // @ts-expect-error test double
      mockContext
    );
    expect(result.edges.length).toBe(0);
  });
});

describe("allArticlesQuery - native environments stubs", () => {
  it("should cover toBase64 and fromBase64 native paths", async () => {
    /* eslint-disable no-extend-native */
    const originalToBase64 = (Uint8Array.prototype as any).toBase64;
    const originalFromBase64 = (Uint8Array as any).fromBase64;

    Object.defineProperty(Uint8Array.prototype, "toBase64", {
      configurable: true,
      value() {
        return Buffer.from(this).toString("base64");
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
      const mockArticles = [
        {
          feedId: FEED_ID_1,
          id: "1",
          publishedAt: PUBLISHED_AT_1,
          title: ARTICLE_TITLE_1
        }
      ];
      const mockDatabase = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue(mockArticles),
          orderBy: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis()
        })
      };

      // @ts-expect-error test double
      const resolver = allArticlesQuery(mockDatabase);
      const result = await resolver(
        undefined,
        {
          after: encodeCursor([PUBLISHED_AT_1, "1"]),
          first: 1
        },
        // @ts-expect-error test double
        mockContext
      );
      expect(result.edges.length).toBe(1);
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
  });

  it("should cover fromBase64 throwing on invalid base64", async () => {
    const originalFromBase64 = (Uint8Array as any).fromBase64;
    Object.defineProperty(Uint8Array, "fromBase64", {
      configurable: true,
      value: () => {
        throw new Error("Invalid base64");
      },
      writable: true
    });

    try {
      const mockDatabase = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
          orderBy: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis()
        })
      };

      // @ts-expect-error test double
      const resolver = allArticlesQuery(mockDatabase);
      const result = await resolver(
        undefined,
        { after: "invalid!!" },
        // @ts-expect-error test double
        mockContext
      );
      expect(result.edges.length).toBe(0);
    } finally {
      if (undefined === originalFromBase64) {
        delete (Uint8Array as any).fromBase64;
      } else {
        (Uint8Array as any).fromBase64 = originalFromBase64;
      }
    }
  });
});
