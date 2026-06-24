import { auth } from "@ethang/intl/en/auth.ts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MockLoggerClient } from "./test-utilities/mock-logger-client.ts";
import { MockWorkflowEntrypoint } from "./test-utilities/mock-workflow-entrypoint.ts";
import {
  LOGGER_KEY,
  SOME_NON_ERROR_OBJECT,
  SOME_OTHER_D1_ERROR
} from "./test-utilities/test-constants.ts";

vi.mock("cloudflare:workers", () => {
  return {
    WorkerEntrypoint: class {
      public ctx: Record<string, unknown> = {};
      public env: Record<string, unknown> = {};
    },
    WorkflowEntrypoint: MockWorkflowEntrypoint
  };
});

vi.mock("@ethang/logger-sdk", () => {
  return {
    LoggerClient: MockLoggerClient
  };
});

vi.mock("drizzle-orm/d1", () => {
  return {
    drizzle: vi.fn().mockReturnValue({})
  };
});

vi.mock("./data/mutations/add-subscription.ts", () => {
  return {
    addSubscriptionMutation: vi.fn().mockResolvedValue(undefined)
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

vi.mock("./data/queries/all-articles.ts", () => {
  return {
    allArticlesQuery: vi.fn().mockResolvedValue(undefined)
  };
});

vi.mock("./data/queries/feed-articles.ts", () => {
  return {
    feedArticlesQuery: vi.fn().mockResolvedValue(undefined)
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

const WorkerClassConstructor = WorkerClass as unknown as new () => {
  env: Record<string, unknown>;
};

const createInstance = (environment: Record<string, any> = {}): any => {
  const instance = new WorkerClassConstructor();
  instance.env = environment;
  return instance;
};

describe("ethang-rss WorkerEntrypoint", () => {
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

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should respond OK on fetch", async () => {
    const instance = createInstance({ ethang_rss: {} });
    const response = await instance.fetch(new Request("https://example.com/"));
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toBe("OK");
  });

  it("should expose all RPC methods", () => {
    const instance = createInstance();

    expect(instance.allArticles).toBeInstanceOf(Function);
    expect(instance.feedArticles).toBeInstanceOf(Function);
    expect(instance.subscription).toBeInstanceOf(Function);
    expect(instance.subscriptions).toBeInstanceOf(Function);
    expect(instance.addSubscription).toBeInstanceOf(Function);
    expect(instance.markArticleRead).toBeInstanceOf(Function);
  });

  describe("RPC methods", () => {
    it("markArticleRead marks an article as read", async () => {
      const instance = createInstance({ ethang_rss: {} });
      const result = await instance.markArticleRead({
        articleId: "a1",
        isRead: true,
        sessionToken: auth.TEST_TOKEN
      });
      expect(result).toEqual({ articleId: "a1", isRead: true });
    });

    it("subscription returns a subscription", async () => {
      const instance = createInstance({ ethang_rss: {} });
      const result = await instance.subscription({ feedId: "feed1" });
      expect(result).toEqual({ id: "feed1", title: "Test Feed" });
    });

    it("subscriptions returns paginated subscriptions", async () => {
      const instance = createInstance({ ethang_rss: {} });
      const result = await instance.subscriptions({
        first: 10,
        sessionToken: auth.TEST_TOKEN,
        sortBy: { direction: "ASC", field: "TITLE" }
      });
      expect(result).toEqual({
        edges: [],
        pageInfo: { hasNextPage: false }
      });
    });

    it("addSubscription adds a subscription", async () => {
      const instance = createInstance({ ethang_rss: {} });
      const result = await instance.addSubscription({
        sessionToken: auth.TEST_TOKEN,
        xmlAddress: "https://example.com/feed.xml"
      });
      expect(result).toBeUndefined();
    });

    it("rejects with unauthorized when auth fails", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false
        })
      );
      const instance = createInstance({ ethang_rss: {} });
      await expect(
        instance.allArticles({ sessionToken: "bad-token" })
      ).rejects.toThrow("Unauthorized");
    });

    it("allArticles returns paginated articles", async () => {
      const instance = createInstance({ ethang_rss: {} });
      const result = await instance.allArticles({
        first: 10,
        sessionToken: auth.TEST_TOKEN
      });
      expect(result).toBeUndefined();
    });

    it("feedArticles returns paginated feed articles", async () => {
      const instance = createInstance({ ethang_rss: {} });
      const result = await instance.feedArticles({
        feedId: "feed1",
        first: 10,
        sessionToken: auth.TEST_TOKEN
      });
      expect(result).toBeUndefined();
    });
  });

  describe("scheduled handler", () => {
    it("creates a workflow run successfully", async () => {
      const createMock = vi.fn().mockResolvedValue({});
      const instance = createInstance({
        FETCH_FEEDS_WORKFLOW: { create: createMock }
      });

      await expect(
        instance.scheduled({ scheduledTime: 123_456 })
      ).resolves.not.toThrow();
      expect(createMock).toHaveBeenCalledWith({
        id: "fetch-feeds-123456"
      });
    });

    it("handles workflow already exists error silently", async () => {
      const createMock = vi
        .fn()
        .mockRejectedValue(new Error("Workflow already exists"));
      const instance = createInstance({
        FETCH_FEEDS_WORKFLOW: { create: createMock }
      });

      await expect(
        instance.scheduled({ scheduledTime: 123_456 })
      ).resolves.not.toThrow();
    });

    it("logs other errors and rethrows them", async () => {
      const createMock = vi
        .fn()
        .mockRejectedValue(new Error(SOME_OTHER_D1_ERROR));
      const instance = createInstance({
        ENVIRONMENT: "test",
        FETCH_FEEDS_WORKFLOW: { create: createMock },
        LOGGER_API_KEY: LOGGER_KEY
      });

      await expect(
        instance.scheduled({ scheduledTime: 123_456 })
      ).rejects.toThrow(SOME_OTHER_D1_ERROR);
    });

    it("logs other non-Error objects and rethrows them with default environment", async () => {
      const createMock = vi.fn().mockRejectedValue(SOME_NON_ERROR_OBJECT);
      const instance = createInstance({
        FETCH_FEEDS_WORKFLOW: { create: createMock },
        LOGGER_API_KEY: LOGGER_KEY
      });

      await expect(
        instance.scheduled({ scheduledTime: 123_456 })
      ).rejects.toThrow(SOME_NON_ERROR_OBJECT);
    });
  });
});
