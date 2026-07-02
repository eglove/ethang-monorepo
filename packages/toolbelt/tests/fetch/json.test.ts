import { Schema } from "effect";
import isError from "lodash/isError.js";
import { describe, expect, it } from "vitest";

import { parseFetchJson } from "../../src/fetch/json.ts";

const testUrl = "https://example.com";

describe("fetch json", () => {
  it("should parse request body correctly", async () => {
    const request = new Request(testUrl, {
      body: JSON.stringify({ json: "stuff" }),
      method: "POST"
    });
    const results = await parseFetchJson(
      request,
      Schema.Struct({ json: Schema.String })
    );

    expect(isError(results)).toBe(false);
    expect(results).toStrictEqual({ json: "stuff" });
  });

  it("should parse response body correctly", async () => {
    const response = Response.json({
      json: "stuff"
    });
    const results = await parseFetchJson(
      response,
      Schema.Struct({ json: Schema.String })
    );

    expect(isError(results)).toBe(false);
    expect(results).toStrictEqual({ json: "stuff" });
  });
});

describe("error cases", () => {
  it("should return Error when validation is incorrect", async () => {
    const request = new Request(testUrl, {
      body: JSON.stringify({ fail: 0 }),
      method: "POST"
    });
    const results = await parseFetchJson(
      request,
      Schema.Struct({ fail: Schema.String })
    );

    expect(isError(results)).toBe(true);
    expect(results).toBeInstanceOf(Error);
  });

  it("should return Error when validation is incorrect with array", async () => {
    const request = new Request(testUrl, {
      body: JSON.stringify({ fail: 0 }),
      method: "POST"
    });
    const results = await parseFetchJson(
      request,
      Schema.Array(Schema.Struct({ fail: Schema.String }))
    );

    expect(isError(results)).toBe(true);
    expect(results).toBeInstanceOf(Error);
  });

  it("should return error with invalid JSON", async () => {
    const request = new Request(testUrl, {
      body: "",
      method: "POST"
    });
    const results = await parseFetchJson(
      request,
      Schema.Array(Schema.Struct({ fail: Schema.String }))
    );

    expect(isError(results)).toBe(true);
    expect(results).toBeInstanceOf(Error);
  });
});
