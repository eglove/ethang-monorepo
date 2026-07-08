import { Effect } from "effect";
import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { parseJson } from "../../src/json/json.ts";

describe("parse json", () => {
  it("should parse json string correctly", async () => {
    const json = JSON.stringify({ json: "stuff" });
    const results = await Effect.runPromise(
      parseJson(json, Schema.Struct({ json: Schema.String }))
    );

    expect(results).toStrictEqual({ json: "stuff" });
  });

  it("should fail with Error when validation is incorrect", async () => {
    const json = JSON.stringify({ fail: 0 });
    const result = await Effect.runPromise(
      parseJson(json, Schema.Struct({ fail: Schema.String })).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Validation failed");
  });

  it("should fail with Error for invalid JSON", async () => {
    const result = await Effect.runPromise(
      parseJson("", Schema.Struct({ name: Schema.String })).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Unexpected end of JSON input");
  });

  it("wraps non-Error parser rejections in an Error", async () => {
    const original = JSON.parse;
    (JSON as { parse: typeof JSON.parse }).parse = (() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw "string-failure";
    }) as typeof JSON.parse;
    try {
      const result = await Effect.runPromise(
        parseJson("{}", Schema.Struct({ name: Schema.String })).pipe(Effect.flip)
      );
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("string-failure");
    } finally {
      (JSON as { parse: typeof JSON.parse }).parse = original;
    }
  });

  it("should wrap non-Error parser rejections in an Error", async () => {
    const original = JSON.parse;
    JSON.parse = () => {
      throw "string-failure";
    };
    try {
      const result = await Effect.runPromise(
        parseJson("{}", Schema.Struct({ name: Schema.String })).pipe(Effect.flip)
      );
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("string-failure");
    } finally {
      JSON.parse = original;
    }
  });
});
