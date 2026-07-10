import { auth } from "@ethang/intl/en/auth.ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MockWorkflowEntrypoint } from "./test-utilities/mock-workflow-entrypoint.ts";

vi.mock("cloudflare:workers", () => {
  return {
    WorkerEntrypoint: class {
      public ctx: Record<string, unknown> = {};
      public env: Record<string, unknown> = {};
    },
    WorkflowEntrypoint: MockWorkflowEntrypoint
  };
});

vi.mock("drizzle-orm/d1", () => {
  return {
    drizzle: vi.fn().mockReturnValue({})
  };
});

vi.mock("./data/mutations/add-subscription.ts", () => {
  return {
    addSubscriptionMutation: vi.fn().mockResolvedValue(null)
  };
});

vi.mock("./data/mutations/mark-article-read.ts", () => {
  return {
    markArticleReadMutation: vi.fn().mockResolvedValue({
      articleId: "a1",
      isRead: true
    })
  };
});

vi.mock("./data/mutations/remove-subscription.ts", () => {
  return {
    removeSubscriptionMutation: vi.fn().mockResolvedValue(null)
  };
});

vi.mock("./data/queries/all-articles.ts", () => {
  return {
    allArticlesQuery: vi.fn().mockResolvedValue(null)
  };
});

vi.mock("./data/queries/feed-articles.ts", () => {
  return {
    feedArticlesQuery: vi.fn().mockResolvedValue(null)
  };
});

vi.mock("./data/queries/subscription.ts", () => {
  return {
    subscriptionQuery: vi
      .fn()
      .mockResolvedValue({ id: "feed1", title: "Test Feed" })
  };
});

vi.mock("./data/queries/subscriptions.ts", () => {
  return {
    subscriptionsQuery: vi
      .fn()
      .mockResolvedValue({ edges: [], pageInfo: { hasNextPage: false } })
  };
});

import WorkerClass from "./index.ts";

const CACHE_CONTROL_HEADER = "Cache-Control";
const CACHE_TAG_HEADER = "Cache-Tag";
const NO_STORE = "no-store";
const PUBLIC_CACHE_CONTROL =
  "public, max-age=300, stale-while-revalidate=3600" as const;
const VARY_COOKIE = "Cookie";
const VARY_HEADER = "Vary";

const WorkerClassConstructor = WorkerClass as unknown as new () => {
  env: Record<string, unknown>;
};

const createInstance = (environment: Record<string, any> = {}): any => {
  const instance = new WorkerClassConstructor();
  instance.env = environment;
  return instance;
};

describe("ethang-rss WorkerEntrypoint cache headers", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => {
          return { email: "test@test.com", sub: "test-sub" };
        },
        ok: true
      })
    );
  });

  const NO_CACHE_TAG = null;
  const FEED_ID = "feed-7";

  describe.each([
    {
      cacheControl: NO_STORE,
      cacheTag: NO_CACHE_TAG,
      expectedVary: VARY_COOKIE,
      feedId: FEED_ID,
      method: "allArticles" as const,
      params: () => {
        return { first: 5, sessionToken: auth.TEST_TOKEN };
      }
    },
    {
      cacheControl: NO_STORE,
      cacheTag: NO_CACHE_TAG,
      expectedVary: VARY_COOKIE,
      feedId: FEED_ID,
      method: "feedArticles" as const,
      params: () => {
        return {
          feedId: FEED_ID,
          first: 5,
          sessionToken: auth.TEST_TOKEN
        };
      }
    },
    {
      cacheControl: NO_STORE,
      cacheTag: NO_CACHE_TAG,
      expectedVary: VARY_COOKIE,
      feedId: FEED_ID,
      method: "subscriptions" as const,
      params: () => {
        return {
          first: 10,
          sessionToken: auth.TEST_TOKEN,
          sortBy: { direction: "ASC", field: "TITLE" as const }
        };
      }
    }
  ])(
    "per-user read $method",
    ({ cacheControl, cacheTag, expectedVary, method, params }) => {
      it(`sets Cache-Control="${cacheControl}" and no Cache-Tag`, async () => {
        const instance = createInstance({ ethang_rss: {} });
        const response = await instance[method](params());
        expect(response).toBeInstanceOf(Response);
        expect(response.headers.get(CACHE_CONTROL_HEADER)).toBe(cacheControl);
        expect(response.headers.get(CACHE_TAG_HEADER)).toBe(cacheTag);
        expect(response.headers.get(VARY_HEADER)).toBe(expectedVary);
      });
    }
  );

  describe.each([
    {
      method: "addSubscription" as const,
      params: () => {
        return {
          sessionToken: auth.TEST_TOKEN,
          xmlAddress: "https://example.com/feed.xml"
        };
      }
    },
    {
      method: "removeSubscription" as const,
      params: () => {
        return { feedId: "feed-1", sessionToken: auth.TEST_TOKEN };
      }
    },
    {
      method: "markArticleRead" as const,
      params: () => {
        return {
          articleId: "a1",
          isRead: true,
          sessionToken: auth.TEST_TOKEN
        };
      }
    }
  ])("mutation $method", ({ method, params }) => {
    it(`sets Cache-Control="${NO_STORE}" and no Cache-Tag`, async () => {
      const instance = createInstance({ ethang_rss: {} });
      const response = await instance[method](params());
      expect(response).toBeInstanceOf(Response);
      expect(response.headers.get(CACHE_CONTROL_HEADER)).toBe(NO_STORE);
      expect(response.headers.get(CACHE_TAG_HEADER)).toBeNull();
    });
  });

  describe("public read subscription", () => {
    it.each([
      {
        expectedTags: "subscriptions, subscription:feed-1",
        feedId: "feed-1"
      },
      {
        expectedTags: "subscriptions, subscription:feed-2",
        feedId: "feed-2"
      }
    ])(
      `sets Cache-Control="${PUBLIC_CACHE_CONTROL}" with tags $expectedTags for feedId=$feedId`,
      async ({ expectedTags, feedId }) => {
        const instance = createInstance({ ethang_rss: {} });
        const response = await instance.subscription({ feedId });
        expect(response).toBeInstanceOf(Response);
        expect(response.headers.get(CACHE_CONTROL_HEADER)).toBe(
          PUBLIC_CACHE_CONTROL
        );
        expect(response.headers.get(CACHE_TAG_HEADER)).toBe(expectedTags);
      }
    );

    it("serializes the subscription body as JSON", async () => {
      const instance = createInstance({ ethang_rss: {} });
      const response = await instance.subscription({ feedId: "feed1" });
      expect(await response.json()).toEqual({
        id: "feed1",
        title: "Test Feed"
      });
    });
  });
});
