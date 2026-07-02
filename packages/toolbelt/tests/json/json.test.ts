import { Schema } from "effect";
import isError from "lodash/isError.js";
import { describe, expect, it } from "vitest";

import { parseJson } from "../../src/json/json.ts";

describe("parse json", () => {
  it("should parse json string correctly", () => {
    const json = JSON.stringify({ json: "stuff" });
    const results = parseJson(json, Schema.Struct({ json: Schema.String }));

    expect(isError(results)).toBe(false);
    expect(results).toStrictEqual({ json: "stuff" });
  });

  it("should return Error when validation is incorrect", () => {
    const json = JSON.stringify({ fail: 0 });
    const results = parseJson(json, Schema.Struct({ fail: Schema.String }));

    expect(isError(results)).toBe(true);
    expect(results).toBeInstanceOf(Error);
  });

  it("should return error for invalid JSON", () => {
    const results = parseJson("", Schema.Struct({ name: Schema.String }));

    expect(isError(results)).toBe(true);
    expect(results).toBeInstanceOf(Error);
    if (isError(results)) {
      expect(results.message).toBe("Unexpected end of JSON input");
    }
  });
});
