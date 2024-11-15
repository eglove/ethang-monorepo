import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import { describe, expect, it } from "vitest";
import { z, ZodError } from "zod";

import { parseJson } from "../../src/json/json.ts";

describe("parse json", () => {
  it("should parse json string correctly", () => {
    const json = JSON.stringify({ json: "stuff" });
    const results = parseJson(json, z.object({ json: z.string() }));

    expect(isError(results)).toBe(false);
    expect(results).toStrictEqual({ json: "stuff" });
  });

  it("should return ZodError when validation is incorrect", () => {
    const json = JSON.stringify({ fail: 0 });
    const results = parseJson(json, z.object({ fail: z.string() }));

    expect(isError(results)).toBe(true);
    expect(results).toBeInstanceOf(ZodError);

    if (results instanceof ZodError && !isNil(results.issues[0])) {
      expect(results.issues[0].message).toStrictEqual(
        "Expected string, received number",
      );
    }
  });

  it("should return error for invalid JSON", () => {
    const results = parseJson("", z.object({ name: z.string() }));

    expect(isError(results)).toBe(true);
    expect(results).toBeInstanceOf(Error);
    if (isError(results)) {
      expect(results.message).toBe("Unexpected end of JSON input");
    }
  });
});
