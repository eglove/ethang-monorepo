import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";

import { parseJson } from "../../src/json/json.ts";

const NAME_STRING_SCHEMA = Schema.Struct({ name: Schema.String });
const EMPTY_OBJECT = "{}";
const JSON_STRING_SCHEMA = Schema.Struct({ json: Schema.String });
const FAIL_STRING_SCHEMA = Schema.Struct({ fail: Schema.String });
const STRING_FAILURE = "string-failure";

describe("parse json", () => {
  it("should parse json string correctly", async () => {
    const json = JSON.stringify({ json: "stuff" });
    const results = await Effect.runPromise(
      parseJson(json, JSON_STRING_SCHEMA)
    );

    expect(results).toStrictEqual({ json: "stuff" });
  });

  it("should fail with Error when validation is incorrect", async () => {
    const json = JSON.stringify({ fail: 0 });
    const result = await Effect.runPromise(
      parseJson(json, FAIL_STRING_SCHEMA).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Validation failed");
  });

  it("should fail with Error for invalid JSON", async () => {
    const result = await Effect.runPromise(
      parseJson("", NAME_STRING_SCHEMA).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Unexpected end of JSON input");
  });

  it("wraps non-Error parser rejections in an Error", async () => {
    const original = JSON.parse;
    function throwingParser() {
      throw STRING_FAILURE;
    }
    (JSON as { parse: typeof JSON.parse }).parse =
      throwingParser as typeof JSON.parse;
    try {
      const result = await Effect.runPromise(
        parseJson(EMPTY_OBJECT, NAME_STRING_SCHEMA).pipe(Effect.flip)
      );
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe(STRING_FAILURE);
    } finally {
      (JSON as { parse: typeof JSON.parse }).parse = original;
    }
  });
});
