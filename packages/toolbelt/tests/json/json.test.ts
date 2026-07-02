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
});
