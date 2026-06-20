import { describe, expect, it, vi } from "vitest";

import { MockApolloServer } from "./test-utilities/mock-apollo-server.ts";
import { MockLoggerClient } from "./test-utilities/mock-logger-client.ts";
import { MockWorkflowEntrypoint } from "./test-utilities/mock-workflow-entrypoint.ts";
import {
  ARTICLE_LOADER,
  FEED_LOADER,
  LOGGER_KEY,
  SOME_NON_ERROR_OBJECT,
  SOME_OTHER_D1_ERROR,
  TEST_EMAIL,
  TEST_SUB,
  USER_ARTICLE_STATE_LOADER
} from "./test-utilities/test-constants.ts";

vi.mock("cloudflare:workers", () => {
  return {
    WorkflowEntrypoint: MockWorkflowEntrypoint
  };
});

const mockHandler = vi.fn().mockResolvedValue(new Response("GraphQL Response"));
const store = {
  capturedOptions: null as unknown
};

vi.mock("@as-integrations/cloudflare-workers", () => {
  return {
    startServerAndCreateCloudflareWorkersHandler: vi
      .fn()
      .mockImplementation((_server, options) => {
        store.capturedOptions = options;
        return mockHandler;
      })
  };
});

vi.mock("@apollo/server", () => {
  return {
    ApolloServer: MockApolloServer
  };
});

vi.mock("@apollo/server/plugin/landingPage/default", () => {
  return {
    ApolloServerPluginLandingPageLocalDefault: vi.fn()
  };
});

vi.mock("./graphql/schema.ts", () => {
  return {
    createSchema: vi.fn()
  };
});

vi.mock("./graphql/util/depth-limit.ts", () => {
  return {
    depthLimit: vi.fn()
  };
});

vi.mock("./authenticate.ts", () => {
  return {
    authenticate: vi
      .fn()
      .mockResolvedValue({ email: TEST_EMAIL, sub: TEST_SUB })
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

vi.mock("./graphql/data-loader/article-loader.ts", () => {
  return {
    createArticleLoader: vi.fn().mockReturnValue(ARTICLE_LOADER)
  };
});

vi.mock("./graphql/data-loader/feed-loader.ts", () => {
  return {
    createFeedLoader: vi.fn().mockReturnValue(FEED_LOADER)
  };
});

vi.mock("./graphql/data-loader/user-article-state-loader.ts", () => {
  return {
    createUserArticleStateLoader: vi
      .fn()
      .mockReturnValue(USER_ARTICLE_STATE_LOADER)
  };
});

import worker from "./index.ts";

describe("worker fetch", () => {
  it("initializes apollo handler and handles fetch", async () => {
    const serverInstance = new MockApolloServer();
    expect(serverInstance).toBeDefined();

    const request = new Request("https://example.com/graphql");
    const environment = { ethang_rss: {} };
    const context = {};

    // @ts-expect-error for test
    const response = await worker.fetch(request, environment, context);
    expect(response).toBeInstanceOf(Response);
    expect(mockHandler).toHaveBeenCalledWith(request, environment, context);
    expect(store.capturedOptions).toBeDefined();

    // Verify context creation callback
    const contextResult = await (store.capturedOptions as any).context({
      request
    });
    expect(contextResult).toEqual({
      articleLoader: ARTICLE_LOADER,
      feedLoader: FEED_LOADER,
      user: { email: TEST_EMAIL, sub: TEST_SUB },
      userArticleStateLoader: USER_ARTICLE_STATE_LOADER
    });

    // Run fetch again to test handler caching path
    // @ts-expect-error for test
    const secondResponse = await worker.fetch(request, environment, context);
    expect(secondResponse).toBeInstanceOf(Response);
  });
});

describe("worker scheduled", () => {
  it("creates a workflow run successfully", async () => {
    const createMock = vi.fn().mockResolvedValue({});
    const environment = {
      FETCH_FEEDS_WORKFLOW: {
        create: createMock
      }
    };
    const event = { scheduledTime: 123_456 };

    // @ts-expect-error for test
    await expect(worker.scheduled(event, environment)).resolves.not.toThrow();
    expect(createMock).toHaveBeenCalledWith({ id: "fetch-feeds-123456" });
  });

  it("handles workflow already exists error silently", async () => {
    const createMock = vi
      .fn()
      .mockRejectedValue(new Error("Workflow already exists"));
    const environment = {
      FETCH_FEEDS_WORKFLOW: {
        create: createMock
      }
    };
    const event = { scheduledTime: 123_456 };

    // @ts-expect-error for test
    await expect(worker.scheduled(event, environment)).resolves.not.toThrow();
  });

  it("logs other errors and rethrows them", async () => {
    const createMock = vi
      .fn()
      .mockRejectedValue(new Error(SOME_OTHER_D1_ERROR));
    const environment = {
      ENVIRONMENT: "test",
      FETCH_FEEDS_WORKFLOW: {
        create: createMock
      },
      LOGGER_API_KEY: LOGGER_KEY
    };
    const event = { scheduledTime: 123_456 };

    // @ts-expect-error for test
    await expect(worker.scheduled(event, environment)).rejects.toThrow(
      SOME_OTHER_D1_ERROR
    );
  });

  it("logs other non-Error objects and rethrows them with default environment", async () => {
    const createMock = vi.fn().mockRejectedValue(SOME_NON_ERROR_OBJECT);
    const environment = {
      FETCH_FEEDS_WORKFLOW: {
        create: createMock
      },
      LOGGER_API_KEY: LOGGER_KEY
    };
    const event = { scheduledTime: 123_456 };

    // @ts-expect-error for test
    await expect(worker.scheduled(event, environment)).rejects.toThrow(
      SOME_NON_ERROR_OBJECT
    );
  });
});
