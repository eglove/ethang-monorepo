import isError from "lodash/isError.js";
import { describe, expect, it } from "vitest";
import { Schema } from "effect";

import { createUrl } from "../../src/fetch/create-url.ts";
import { vi } from "vitest";

vi.mock("../../src/fetch/create-search-parameters.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/fetch/create-search-parameters.ts")>();
  return {
    ...actual,
    createSearchParameters: vi.fn().mockImplementation((params, schema) => {
      if (params && params["mockNil"] === true) {
        return null as any;
      }
      return actual.createSearchParameters(params, schema);
    }),
  };
});

const typicode = "https://jsonplaceholder.typicode.com";

describe("url builder", () => {
  it("build the url", () => {
    const url = createUrl("todos/:id", {
      pathVariables: { id: "2" },
      pathVariablesSchema: Schema.Struct({ id: Schema.String }),
      searchParams: {
        filter: "done",
        orderBy: "due",
      },
      searchParamsSchema: Schema.Struct({
        filter: Schema.String,
        orderBy: Schema.String,
      }),
      urlBase: typicode,
    });

    expect(isError(url)).toBe(false);
    expect(url).toBeInstanceOf(URL);

    if (url instanceof URL) {
      expect(url.searchParams).toStrictEqual(
        new URLSearchParams({
          filter: "done",
          orderBy: "due",
        }),
      );

      expect(url.toString()).toBe(
        "https://jsonplaceholder.typicode.com/todos/2?filter=done&orderBy=due",
      );
    }
  });

  it("should build url with an array of search params", () => {
    const url = createUrl("todos/:id", {
      searchParams: { filter: ["done", "recent", "expired"] },
      searchParamsSchema: Schema.Struct({
        filter: Schema.Union(Schema.String, Schema.Array(Schema.String)),
      }),
      urlBase: typicode,
    });

    expect(isError(url)).toBe(false);
    expect(url).toBeInstanceOf(URL);

    if (url instanceof URL) {
      const searchParameters = new URLSearchParams();
      searchParameters.append("filter", "done");
      searchParameters.append("filter", "recent");
      searchParameters.append("filter", "expired");

      expect(url.searchParams).toStrictEqual(searchParameters);
    }
  });

  it("should fail with bad urls", () => {
    const badUrl = createUrl("bad-url", {
      pathVariables: { id: "invalid" },
      pathVariablesSchema: Schema.Struct({ id: Schema.Number }),
      searchParams: {
        filter: "done",
        orderBy: "due",
      },
      searchParamsSchema: Schema.Struct({
        filter: Schema.String,
        orderBy: Schema.String,
      }),
      urlBase: typicode,
    });

    expect(isError(badUrl)).toBe(true);
    expect(badUrl).toBeInstanceOf(Error);
  });

  it("should return error if path variables are found but schema is not", () => {
    const url = createUrl("todos", {
      pathVariables: { id: "2" },
      urlBase: "https://example.com",
    });

    expect(isError(url)).toBe(true);
    expect(url).toBeInstanceOf(Error);
    if (isError(url)) {
      expect(url.message).toBe("must provide path variables schema");
    }
  });

  it("should return error for invalid url", () => {
    // @ts-expect-error for test
    const url = createUrl("todos", {
      urlBase: undefined,
    });

    expect(isError(url)).toBe(true);
    expect(url).toBeInstanceOf(Error);

    if (isError(url)) {
      expect(url.message).toBe("Invalid URL");
    }
  });

  it("should return error for incorrect search params schema", () => {
    const url = createUrl("todos", {
      searchParams: { id: 1 },
      searchParamsSchema: Schema.Struct({ name: Schema.String }),
      urlBase: "https://example.com",
    });

    expect(isError(url)).toBe(true);
    expect(url).toBeInstanceOf(Error);
  });

  it("should return error is search params are provided but there is no schema", () => {
    const url = createUrl("todos", {
      searchParams: { id: 1 },
      urlBase: "https://example.com",
    });

    expect(isError(url)).toBe(true);
    expect(url).toBeInstanceOf(Error);

    if (isError(url)) {
      expect(url.message).toBe("must provide search parameters schema");
    }
  });

  it("should allow optional path variables", () => {
    const url = createUrl("user/:userId/dashboard/(:dashboardId)", {
      pathVariables: { userId: "3" },
      pathVariablesSchema: Schema.Struct({
        dashboardId: Schema.optional(Schema.String),
        userId: Schema.String,
      }),
      urlBase: "https://example.com",
    });

    expect(isError(url)).toBe(false);
    expect(url).toBeInstanceOf(URL);

    if (url instanceof URL) {
      expect(url.toString()).toBe("https://example.com/user/3/dashboard/");
    }
  });

  it("should return error from createSearchParameters", () => {
    const url = createUrl("todos", {
      searchParams: { filter: "done" },
      searchParamsSchema: Schema.Struct({
        filter: Schema.Number,
      }),
      urlBase: typicode,
    });

    expect(isError(url)).toBe(true);
    expect(url).toBeInstanceOf(Error);
  });

  describe("resolvePath and schema validation behavior", () => {
    it("should return an Error when pathVariablesSchema is not a valid schema", () => {
      const url = createUrl("todos/:id", {
        pathVariables: { id: "2" },
        // @ts-expect-error for testing
        pathVariablesSchema: {},
        urlBase: "https://example.com",
      });

      expect(isError(url)).toBe(true);
    });

    it("should return an Error when searchParamsSchema is not a valid schema", () => {
      const url = createUrl("todos", {
        searchParams: { id: 1 },
        // @ts-expect-error for testing
        searchParamsSchema: {},
        urlBase: "https://example.com",
      });

      expect(isError(url)).toBe(true);
    });

    it("should not append search parameters if createSearchParameters returns nil", () => {
      const url = createUrl("todos", {
        searchParams: { mockNil: true } as any,
        searchParamsSchema: Schema.Struct({ mockNil: Schema.optional(Schema.Boolean) }),
        urlBase: typicode,
      });

      expect(isError(url)).toBe(false);
      expect(url).toBeInstanceOf(URL);
      if (url instanceof URL) {
        expect(url.searchParams.toString()).toBe("");
      }
    });
  });
});

