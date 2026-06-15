import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { graphqlRequest } from "./graphql-client.ts";

const MOCK_QUERY = {
  definitions: [],
  kind: "Document" as const,
  loc: { end: 0, start: 0 }
};

const apiGraphQL = "/api/graphql";

describe("graphqlRequest", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("should successfully execute a GraphQL query and return data", async () => {
    const mockData = { result: "success" };
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ data: mockData }, { status: 200 }));

    // @ts-expect-error for test
    const result = await graphqlRequest(MOCK_QUERY, { testVar: "value" });

    expect(fetchSpy).toHaveBeenCalledWith(apiGraphQL, {
      body: JSON.stringify({
        query: "",
        variables: { testVar: "value" }
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    expect(result).toEqual(mockData);
  });

  it("should include X-Token header if sessionToken exists in localStorage", async () => {
    const mockData = { result: "auth-success" };
    localStorage.setItem(
      "ethang-user",
      JSON.stringify({ sessionToken: "test-token" })
    );

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ data: mockData }, { status: 200 }));

    // @ts-expect-error for test
    const result = await graphqlRequest(MOCK_QUERY);

    expect(fetchSpy).toHaveBeenCalledWith(apiGraphQL, {
      body: JSON.stringify({
        query: "",
        variables: undefined
      }),
      headers: {
        "Content-Type": "application/json",
        "X-Token": "test-token"
      },
      method: "POST"
    });
    expect(result).toEqual(mockData);
  });

  it("should ignore localStorage if JSON is invalid", async () => {
    localStorage.setItem("ethang-user", "{invalid-json}");

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        Response.json({ data: { result: "fallback" } }, { status: 200 })
      );

    // @ts-expect-error for test
    const result = await graphqlRequest(MOCK_QUERY);

    expect(fetchSpy).toHaveBeenCalledWith(
      apiGraphQL,
      expect.objectContaining({
        headers: { "Content-Type": "application/json" }
      })
    );
    expect(result).toEqual({ result: "fallback" });
  });

  it("should throw HTTP error if response is not ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Not Found", { status: 404 })
    );

    // @ts-expect-error for test
    await expect(graphqlRequest(MOCK_QUERY)).rejects.toThrow(
      "HTTP error! Status: 404"
    );
  });

  it("should throw GraphQL error if errors are present in response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        {
          errors: [{ message: "Some GraphQL Error" }]
        },
        { status: 200 }
      )
    );

    // @ts-expect-error for test
    await expect(graphqlRequest(MOCK_QUERY)).rejects.toThrow(
      "Some GraphQL Error"
    );
  });
});
