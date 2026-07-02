import { Effect } from "effect";
import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { parseFetchJson } from "../../src/fetch/json.ts";

const testUrl = "https://example.com";

describe("fetch json", () => {
  it("should parse request body correctly", async () => {
    const request = new Request(testUrl, {
      body: JSON.stringify({ json: "stuff" }),
      method: "POST"
    });
    const results = await Effect.runPromise(
      parseFetchJson(request, Schema.Struct({ json: Schema.String }))
    );

    expect(results).toStrictEqual({ json: "stuff" });
  });

  it("should parse response body correctly", async () => {
    const response = Response.json({
      json: "stuff"
    });
    const results = await Effect.runPromise(
      parseFetchJson(response, Schema.Struct({ json: Schema.String }))
    );

    expect(results).toStrictEqual({ json: "stuff" });
  });
});

describe("error cases", () => {
  it("should fail with Error when validation is incorrect", async () => {
    const request = new Request(testUrl, {
      body: JSON.stringify({ fail: 0 }),
      method: "POST"
    });
    const result = await Effect.runPromise(
      parseFetchJson(request, Schema.Struct({ fail: Schema.String })).pipe(
        Effect.flip
      )
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Validation failed");
  });

  it("should fail with Error when validation is incorrect with array", async () => {
    const request = new Request(testUrl, {
      body: JSON.stringify({ fail: 0 }),
      method: "POST"
    });
    const result = await Effect.runPromise(
      parseFetchJson(
        request,
        Schema.Array(Schema.Struct({ fail: Schema.String }))
      ).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Validation failed");
  });

  it("should fail with Error with invalid JSON", async () => {
    const request = new Request(testUrl, {
      body: "",
      method: "POST"
    });
    const result = await Effect.runPromise(
      parseFetchJson(
        request,
        Schema.Array(Schema.Struct({ fail: Schema.String }))
      ).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Unexpected end of JSON input");
  });
});
