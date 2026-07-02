import { Schema } from "effect";
import create from "lodash/create.js";
import { describe, expect, it } from "vitest";

import { createSearchParameters } from "../../src/fetch/create-search-parameters.ts";

describe("create search parameters", () => {
  it("should create url with params", () => {
    const result = createSearchParameters(
      {
        filter: ["done", "recent", "expired"],
        max: 100,
        numbers: [1, 2, 3],
        otherValue: undefined,
        to: "tomorrow"
      },
      Schema.Struct({
        filter: Schema.Array(Schema.String),
        max: Schema.Number,
        numbers: Schema.Array(Schema.Number),
        otherValue: Schema.Undefined,
        to: Schema.String
      })
    );
    const expected = new URLSearchParams();
    expected.append("filter", "done");
    expected.append("filter", "recent");
    expected.append("filter", "expired");
    expected.append("max", "100");
    expected.append("numbers", "1");
    expected.append("numbers", "2");
    expected.append("numbers", "3");
    expected.append("to", "tomorrow");

    expect(expected.toString()).toEqual(result.toString());
    expect(expected).toStrictEqual(result);
  });

  it("skips nil values within an array parameter", () => {
    const result = createSearchParameters(
      // @ts-expect-error testing nil guard in array
      { tags: [null, "a", undefined, "b"] },
      Schema.Struct({
        // @ts-expect-error for test
        // eslint-disable-next-line unicorn/max-nested-calls
        tags: Schema.Array(Schema.optional(Schema.NullOr(Schema.String)))
      })
    );

    const expected = new URLSearchParams();
    expected.append("tags", "a");
    expected.append("tags", "b");

    expect(result.toString()).toBe(expected.toString());
  });

  it("should return error when validation fails", () => {
    const result = createSearchParameters(
      {
        filter: ["done", "recent", "expired"]
      },
      Schema.Struct({
        filter: Schema.Array(Schema.Number)
      })
    );

    expect(result).toBeInstanceOf(Error);
  });

  it("should ignore inherited properties", () => {
    const parent = { a: "parent" };
    const child = create(parent);
    // @ts-expect-error for test
    child.b = "child";

    const result = createSearchParameters(
      child,
      Schema.Struct({ a: Schema.optional(Schema.String), b: Schema.String })
    );

    const expected = new URLSearchParams();
    expected.append("b", "child");

    expect(result.toString()).toBe(expected.toString());
  });

  it("should return error when schema is nil or invalid", () => {
    // @ts-expect-error testing nil schema
    const resultNil = createSearchParameters({ max: 100 }, null);
    expect(resultNil).toBeInstanceOf(Error);
    expect((resultNil as Error).message).toBe("must provide a valid schema");

    // @ts-expect-error testing invalid schema lacking decodeUnknownSync
    const resultInvalid = createSearchParameters({ max: 100 }, {});
    expect(resultInvalid).toBeInstanceOf(Error);
    expect((resultInvalid as Error).message).toBe("Validation failed");
  });
});
