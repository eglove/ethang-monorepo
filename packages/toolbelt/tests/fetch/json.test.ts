import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";

import { parseFetchJson } from "../../src/fetch/json.ts";

const TEST_URL = "https://example.com";
const JSON_STRING_SCHEMA = Schema.Struct({ json: Schema.String });
const FAIL_STRING_SCHEMA = Schema.Struct({ fail: Schema.String });
const FAIL_STRING_ARRAY_SCHEMA = Schema.Array(
  Schema.Struct({ fail: Schema.String })
);
const STRING_FAILURE = "string-failure";

describe("fetch json", () => {
  it("should parse request body correctly", async () => {
    const request = new Request(TEST_URL, {
      body: JSON.stringify({ json: "stuff" }),
      method: "POST"
    });
    const results = await Effect.runPromise(
      parseFetchJson(request, JSON_STRING_SCHEMA)
    );

    expect(results).toStrictEqual({ json: "stuff" });
  });

  it("should parse response body correctly", async () => {
    const response = Response.json({
      json: "stuff"
    });
    const results = await Effect.runPromise(
      parseFetchJson(response, JSON_STRING_SCHEMA)
    );

    expect(results).toStrictEqual({ json: "stuff" });
  });
});

describe("error cases", () => {
  it("should fail with Error when validation is incorrect", async () => {
    const request = new Request(TEST_URL, {
      body: JSON.stringify({ fail: 0 }),
      method: "POST"
    });
    const result = await Effect.runPromise(
      parseFetchJson(request, FAIL_STRING_SCHEMA).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Validation failed");
  });

  it("should fail with Error when validation is incorrect with array", async () => {
    const request = new Request(TEST_URL, {
      body: JSON.stringify({ fail: 0 }),
      method: "POST"
    });
    const result = await Effect.runPromise(
      parseFetchJson(request, FAIL_STRING_ARRAY_SCHEMA).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Validation failed");
  });

  it("should fail with Error with invalid JSON", async () => {
    const request = new Request(TEST_URL, {
      body: "",
      method: "POST"
    });
    const result = await Effect.runPromise(
      parseFetchJson(request, FAIL_STRING_ARRAY_SCHEMA).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Unexpected end of JSON input");
  });

  it("wraps non-Error json() rejections in an Error", async () => {
    const fakeResponse = {
      json: async () => {
        throw STRING_FAILURE;
      }
    } as unknown as Response;

    const result = await Effect.runPromise(
      parseFetchJson(fakeResponse, FAIL_STRING_ARRAY_SCHEMA).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe(STRING_FAILURE);
  });
});
