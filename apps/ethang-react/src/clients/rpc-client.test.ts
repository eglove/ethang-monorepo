import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { rpcRequest } from "./rpc-client.ts";

const TEST_TOKEN = "test-session-token";
const TEST_RESULT = { data: "test-result" };

describe("rpcRequest", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(TEST_RESULT, { status: 200 })
    );
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should make a POST request to /api/rpc with the given service and method", async () => {
    const result = await rpcRequest("ethang_courses", "courses", {});

    expect(result).toEqual(TEST_RESULT);

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/rpc", {
      body: JSON.stringify({
        method: "courses",
        params: {},
        service: "ethang_courses"
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });
  });

  it("should send X-Token header when session token is stored in localStorage", async () => {
    localStorage.setItem(
      "ethang-user",
      JSON.stringify({ sessionToken: TEST_TOKEN })
    );

    const result = await rpcRequest("ethang_rss", "allArticles", { first: 10 });

    expect(result).toEqual(TEST_RESULT);

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/rpc", {
      body: JSON.stringify({
        method: "allArticles",
        params: { first: 10 },
        service: "ethang_rss"
      }),
      headers: {
        "Content-Type": "application/json",
        "X-Token": TEST_TOKEN
      },
      method: "POST"
    });
  });

  it("should not send X-Token header when stored user has no sessionToken", async () => {
    localStorage.setItem(
      "ethang-user",
      JSON.stringify({ email: "test@test.com" })
    );

    await rpcRequest("ethang_courses", "courses", {});

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/rpc", {
      body: JSON.stringify({
        method: "courses",
        params: {},
        service: "ethang_courses"
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });
  });

  it("should throw an error when the response is not ok", async () => {
    vi.restoreAllMocks();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Not Found", { status: 404 })
    );

    await expect(rpcRequest("ethang_courses", "courses", {})).rejects.toThrow(
      "HTTP error! Status: 404"
    );
  });

  it("should pass empty params object when parameters are not provided", async () => {
    const result = await rpcRequest("ethang_courses", "courses");

    expect(result).toEqual(TEST_RESULT);

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/rpc", {
      body: JSON.stringify({
        method: "courses",
        params: {},
        service: "ethang_courses"
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });
  });
});
