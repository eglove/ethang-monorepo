import { Effect } from "effect";
import { Schema } from "effect";
import create from "lodash/create.js";
import { describe, expect, it } from "vitest";

import { createSearchParameters } from "../../src/fetch/create-search-parameters.ts";

describe("create search parameters", () => {
  it("should create url with params", async () => {
    const result = await Effect.runPromise(
      createSearchParameters(
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
      )
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

  it("skips nil values within an array parameter", async () => {
    const result = await Effect.runPromise(
      createSearchParameters(
        // @ts-expect-error testing nil guard in array
        { tags: [null, "a", undefined, "b"] },
        Schema.Struct({
          // @ts-expect-error for test
          // eslint-disable-next-line unicorn/max-nested-calls
          tags: Schema.Array(Schema.optional(Schema.NullOr(Schema.String)))
        })
      )
    );

    const expected = new URLSearchParams();
    expected.append("tags", "a");
    expected.append("tags", "b");

    expect(result.toString()).toBe(expected.toString());
  });

  it("should fail with error when validation fails", async () => {
    const result = await Effect.runPromise(
      createSearchParameters(
        {
          filter: ["done", "recent", "expired"]
        },
        Schema.Struct({
          filter: Schema.Array(Schema.Number)
        })
      ).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
  });

  it("should ignore inherited properties", async () => {
    const parent = { a: "parent" };
    const child = create(parent);
    // @ts-expect-error for test
    child.b = "child";

    const result = await Effect.runPromise(
      createSearchParameters(
        child,
        Schema.Struct({ a: Schema.optional(Schema.String), b: Schema.String })
      )
    );

    const expected = new URLSearchParams();
    expected.append("b", "child");

    expect(result.toString()).toBe(expected.toString());
  });

  it("should return error when schema is nil or invalid", async () => {
    const resultNil = await Effect.runPromise(
      createSearchParameters({ max: 100 }, null as any).pipe(Effect.flip)
    );
    expect(resultNil).toBeInstanceOf(Error);
    expect(resultNil.message).toBe("must provide a valid schema");

    const resultInvalid = await Effect.runPromise(
      createSearchParameters({ max: 100 }, {} as any).pipe(Effect.flip)
    );
    expect(resultInvalid).toBeInstanceOf(Error);
    expect(resultInvalid.message).toBe("Validation failed");
  });
});
