import isError from "lodash/isError.js";
import { describe, expect, it } from "vitest";
import { z, ZodError } from "zod";

import { createUrl } from "../../src/fetch/create-url.ts";

const typicode = "https://jsonplaceholder.typicode.com";

describe("url builder", () => {
  it("build the url", () => {
    const url = createUrl("todos/:id", {
      pathVariables: { id: "2" },
      pathVariablesSchema: z.object({ id: z.string() }),
      searchParams: {
        filter: "done",
        orderBy: "due",
      },
      searchParamsSchema: z.object({
        filter: z.string(),
        orderBy: z.string(),
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
      searchParamsSchema: z.object({
        filter: z.string().or(z.array(z.string())),
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
      pathVariablesSchema: z.object({ id: z.number() }),
      searchParams: {
        filter: "done",
        orderBy: "due",
      },
      searchParamsSchema: z.object({
        filter: z.string(),
        orderBy: z.string(),
      }),
      urlBase: typicode,
    });

    expect(isError(badUrl)).toBe(true);
    expect(badUrl).toBeInstanceOf(Error);
  });

  it("should return error if path variables are found but schema is not", () => {
    const url = createUrl("todos", {
      pathVariables: { id: "2" },
      urlBase: "http://example.com",
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
      searchParamsSchema: z.object({ name: z.string() }),
      urlBase: "https://example.com",
    });

    expect(isError(url)).toBe(true);
    expect(url).toBeInstanceOf(ZodError);
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
      pathVariablesSchema: z.object({
        dashboardId: z.string().optional(),
        userId: z.string(),
      }),
      urlBase: "http://example.com",
    });

    expect(isError(url)).toBe(false);
    expect(url).toBeInstanceOf(URL);

    if (url instanceof URL) {
      expect(url.toString()).toBe("http://example.com/user/3/dashboard/");
    }
  });
});
