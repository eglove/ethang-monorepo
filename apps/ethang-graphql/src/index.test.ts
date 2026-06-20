import { describe, expect, it, vi } from "vitest";

import worker from "./index.ts";

vi.mock("@apollo/gateway", () => {
  return {
    ApolloGateway: vi.fn().mockImplementation(function () {
      return {};
    })
  };
});

vi.mock("@apollo/server", () => {
  return {
    ApolloServer: vi.fn().mockImplementation(function () {
      return {};
    })
  };
});

vi.mock("@apollo/server/plugin/landingPage/default", () => {
  return {
    ApolloServerPluginLandingPageLocalDefault: vi.fn()
  };
});

vi.mock("@as-integrations/cloudflare-workers", () => {
  return {
    startServerAndCreateCloudflareWorkersHandler: vi
      .fn()
      .mockReturnValue(
        vi.fn().mockResolvedValue(new Response("GraphQL Response"))
      )
  };
});

vi.mock("./authenticate.ts", () => {
  return {
    authenticate: vi
      .fn()
      .mockResolvedValue({ email: "test@test.com", sub: "123" })
  };
});

vi.mock("./build-service.ts", () => {
  return {
    buildService: vi.fn().mockReturnValue(vi.fn())
  };
});

vi.mock("../public/supergraph.graphql", () => {
  return {
    default: "type Query { hello: String }"
  };
});

describe("ethang-graphql worker", () => {
  it("should initialize and handle fetch", async () => {
    const request = new Request("https://example.com/graphql");
    const environment = {};
    const context = {};

    // @ts-expect-error test
    const response = await worker.fetch(request, environment, context);
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toBe("GraphQL Response");
  });
});
