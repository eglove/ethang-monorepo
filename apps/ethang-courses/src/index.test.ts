import type { ExecutionContext } from "@cloudflare/workers-types";

import { describe, expect, it, vi } from "vitest";

import worker from "./index.ts";

const MOCK_RESPONSE = "mock response";
const MOCK_URL = "https://example.com";

vi.mock("@apollo/server", () => {
  return {
    ApolloServer: class {
      public test = true;
    }
  };
});

vi.mock("@as-integrations/cloudflare-workers", () => {
  return {
    startServerAndCreateCloudflareWorkersHandler: vi
      .fn()
      .mockReturnValue((_request: Request) => {
        return new Response(MOCK_RESPONSE);
      })
  };
});

describe("worker index", () => {
  it("fetches correctly", async () => {
    const request = new Request(MOCK_URL);
    const environment: Parameters<typeof worker.fetch>[1] = {
      // @ts-expect-error test double
      ethang_courses: {}
    };
    // @ts-expect-error test double
    const context: ExecutionContext = {};

    const response = await worker.fetch(request, environment, context);
    expect(response).toBeInstanceOf(Response);
    expect(await response.text()).toBe(MOCK_RESPONSE);

    // Calling it a second time should reuse the handler
    const response2 = await worker.fetch(request, environment, context);
    expect(response2).toBeInstanceOf(Response);
  });
});
