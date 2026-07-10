import { Effect, Schema } from "effect";
import { describe, expect, it, vi } from "vitest";

import { createUrl } from "../../src/fetch/create-url.ts";

vi.mock(
  "../../src/fetch/create-search-parameters.ts",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../src/fetch/create-search-parameters.ts")
      >();
    return {
      ...actual,
      createSearchParameters: vi
        .fn()
        .mockImplementation((parameters, schema) => {
          if (true === parameters?.mockNil) {
            return Effect.succeed(null as any);
          }
          return actual.createSearchParameters(parameters, schema);
        })
    };
  }
);

const TYPICODE_URL = "https://jsonplaceholder.typicode.com";
const TYPICODE_TODO_2_URL =
  "https://jsonplaceholder.typicode.com/todos/2?filter=done&orderBy=due";
const EXAMPLE_URL = "https://example.com";
const STRING_FAILURE = "string-failure";
const DONE = "done";
const DUE = "due";
const PATH_VARIABLES_SCHEMA = Schema.Struct({ id: Schema.String });
const SEARCH_PARAMS_SCHEMA = Schema.Struct({
  filter: Schema.String,
  orderBy: Schema.String
});
const SCHEMA_NAME_STRING = Schema.Struct({ name: Schema.String });

function createStringFailureUrlThrower() {
  throw STRING_FAILURE;
}

describe("url builder", () => {
  it("build the url", async () => {
    const url = await Effect.runPromise(
      createUrl("todos/:id", {
        pathVariables: { id: "2" },
        pathVariablesSchema: PATH_VARIABLES_SCHEMA,
        searchParams: {
          filter: DONE,
          orderBy: DUE
        },
        searchParamsSchema: SEARCH_PARAMS_SCHEMA,
        urlBase: TYPICODE_URL
      })
    );

    expect(url).toBeInstanceOf(URL);

    if (url instanceof URL) {
      expect(url.searchParams).toStrictEqual(
        new URLSearchParams({
          filter: DONE,
          orderBy: DUE
        })
      );

      expect(url.href).toBe(TYPICODE_TODO_2_URL);
    }
  });

  it("should build url with an array of search params", async () => {
    const url = await Effect.runPromise(
      createUrl("todos/:id", {
        searchParams: { filter: [DONE, "recent", "expired"] },
        searchParamsSchema: Schema.Struct({
          filter: Schema.Union(Schema.String, Schema.Array(Schema.String))
        }),
        urlBase: TYPICODE_URL
      })
    );

    expect(url).toBeInstanceOf(URL);

    if (url instanceof URL) {
      const searchParameters = new URLSearchParams();
      searchParameters.append("filter", DONE);
      searchParameters.append("filter", "recent");
      searchParameters.append("filter", "expired");

      expect(url.searchParams).toStrictEqual(searchParameters);
    }
  });

  it("should fail with bad urls", async () => {
    const result = await Effect.runPromise(
      createUrl("bad-url", {
        pathVariables: { id: "invalid" },
        pathVariablesSchema: Schema.Struct({ id: Schema.Number }),
        searchParams: {
          filter: DONE,
          orderBy: DUE
        },
        searchParamsSchema: SEARCH_PARAMS_SCHEMA,
        urlBase: TYPICODE_URL
      }).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
  });

  it("should return error if path variables are found but schema is not", async () => {
    const result = await Effect.runPromise(
      createUrl("todos", {
        pathVariables: { id: "2" },
        urlBase: EXAMPLE_URL
      }).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("must provide path variables schema");
  });

  it("should return error for invalid url", async () => {
    const result = await Effect.runPromise(
      createUrl("todos", {
        // @ts-expect-error testing invalid urlBase
        urlBase: null
      }).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Invalid URL");
  });

  it("should wrap non-Error url constructor rejections in an Error", async () => {
    const original = URL;
    (globalThis as unknown as { URL: unknown }).URL =
      createStringFailureUrlThrower;
    try {
      const result = await Effect.runPromise(
        createUrl("todos", { urlBase: EXAMPLE_URL }).pipe(Effect.flip)
      );
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe(STRING_FAILURE);
    } finally {
      (globalThis as unknown as { URL: unknown }).URL = original;
    }
  });

  it("should return error for incorrect search params schema", async () => {
    const result = await Effect.runPromise(
      createUrl("todos", {
        searchParams: { id: 1 },
        searchParamsSchema: SCHEMA_NAME_STRING,
        urlBase: EXAMPLE_URL
      }).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
  });

  it("should return error is search params are provided but there is no schema", async () => {
    const result = await Effect.runPromise(
      createUrl("todos", {
        searchParams: { id: 1 },
        urlBase: EXAMPLE_URL
      }).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("must provide search parameters schema");
  });

  it("should allow optional path variables", async () => {
    const url = await Effect.runPromise(
      createUrl("user/:userId/dashboard/(:dashboardId)", {
        pathVariables: { userId: "3" },
        pathVariablesSchema: Schema.Struct({
          dashboardId: Schema.optional(Schema.String),
          userId: Schema.String
        }),
        urlBase: EXAMPLE_URL
      })
    );

    expect(url).toBeInstanceOf(URL);

    if (url instanceof URL) {
      expect(url.href).toBe(`${EXAMPLE_URL}/user/3/dashboard/`);
    }
  });

  it("should return error from createSearchParameters", async () => {
    const filterNumberSchema = Schema.Struct({
      filter: Schema.Number
    });
    const result = await Effect.runPromise(
      createUrl("todos", {
        searchParams: { filter: DONE },
        searchParamsSchema: filterNumberSchema,
        urlBase: TYPICODE_URL
      }).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
  });

  describe("resolvePath and schema validation behavior", () => {
    it("should return an Error when pathVariablesSchema is not a valid schema", async () => {
      const result = await Effect.runPromise(
        createUrl("todos/:id", {
          pathVariables: { id: "2" },
          // @ts-expect-error for testing
          pathVariablesSchema: {},
          urlBase: EXAMPLE_URL
        }).pipe(Effect.flip)
      );

      expect(result).toBeInstanceOf(Error);
    });

    it("should return an Error when searchParamsSchema is not a valid schema", async () => {
      const result = await Effect.runPromise(
        createUrl("todos", {
          searchParams: { id: 1 },
          // @ts-expect-error for testing
          searchParamsSchema: {},
          urlBase: EXAMPLE_URL
        }).pipe(Effect.flip)
      );

      expect(result).toBeInstanceOf(Error);
    });

    it("should not append search parameters if createSearchParameters returns nil", async () => {
      const url = await Effect.runPromise(
        createUrl("todos", {
          searchParams: { mockNil: true } as any,
          searchParamsSchema: Schema.Struct({
            mockNil: Schema.optional(Schema.Boolean)
          }),
          urlBase: TYPICODE_URL
        })
      );

      expect(url).toBeInstanceOf(URL);
      if (url instanceof URL) {
        expect(url.searchParams.toString()).toBe("");
      }
    });
  });
});
