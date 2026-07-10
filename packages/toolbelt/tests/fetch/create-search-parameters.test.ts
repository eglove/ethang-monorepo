import { Effect, Schema } from "effect";
import create from "lodash/create.js";
import { describe, expect, it } from "vitest";

import { createSearchParameters } from "../../src/fetch/create-search-parameters.ts";

describe("create search parameters", () => {
  it("should create url with params", async () => {
    const filterSchema = Schema.Array(Schema.String);
    const numbersSchema = Schema.Array(Schema.Number);
    const result = await Effect.runPromise(
      createSearchParameters(
        {
          filter: ["done", "recent", "expired"],
          max: 100,
          numbers: [1, 2, 3],
          otherValue: null,
          to: "tomorrow"
        },
        Schema.Struct({
          filter: filterSchema,
          max: Schema.Number,
          numbers: numbersSchema,
          otherValue: Schema.Null,
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
    const tagsSchema = Schema.Array(Schema.NullOr(Schema.String));
    const result = await Effect.runPromise(
      createSearchParameters(
        // @ts-expect-error testing nil values in array parameter
        { tags: [null, "a", null, "b"] },
        Schema.Struct({
          tags: tagsSchema
        })
      )
    );

    const expected = new URLSearchParams();
    expected.append("tags", "a");
    expected.append("tags", "b");

    expect(result.toString()).toBe(expected.toString());
  });

  it("should fail with error when validation fails", async () => {
    const filterSchema = Schema.Array(Schema.Number);
    const result = await Effect.runPromise(
      createSearchParameters(
        {
          filter: ["done", "recent", "expired"]
        },
        Schema.Struct({
          filter: filterSchema
        })
      ).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
  });

  it("should ignore inherited properties", async () => {
    const parent = { a: "parent" };
    const child: { a?: string; b?: string } = create(parent);
    child.b = "child";

    const inheritedSchema = Schema.Struct({
      a: Schema.optional(Schema.String),
      b: Schema.String
    });
    const result = await Effect.runPromise(
      createSearchParameters(child, inheritedSchema)
    );

    const expected = new URLSearchParams();
    expected.append("b", "child");

    expect(result.toString()).toBe(expected.toString());
  });

  it("should return error when schema is nil or invalid", async () => {
    const resultNil = await Effect.runPromise(
      createSearchParameters({ max: 100 }, null as unknown as never).pipe(
        Effect.flip
      )
    );
    expect(resultNil).toBeInstanceOf(Error);
    expect(resultNil.message).toBe("must provide a valid schema");

    const resultInvalid = await Effect.runPromise(
      createSearchParameters({ max: 100 }, {} as unknown as never).pipe(
        Effect.flip
      )
    );
    expect(resultInvalid).toBeInstanceOf(Error);
    expect(resultInvalid.message).toBe("Validation failed");
  });
});
