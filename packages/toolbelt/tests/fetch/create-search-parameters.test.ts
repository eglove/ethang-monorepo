import { describe, expect, it } from "vitest";
import { z, ZodError } from "zod";

import { createSearchParameters } from "../../src/fetch/create-search-parameters.ts";

describe("create search parameters", () => {
  it("should create url with params", () => {
    const result = createSearchParameters(
      {
        filter: ["done", "recent", "expired"],
        max: 100,
        numbers: [1, 2, 3],
        otherValue: undefined,
        to: "tomorrow",
      },
      z.object({
        filter: z.array(z.string()),
        max: z.number(),
        numbers: z.array(z.number()),
        otherValue: z.undefined(),
        to: z.string(),
      }),
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

  it("should return error when validation fails", () => {
    const result = createSearchParameters(
      {
        filter: ["done", "recent", "expired"],
      },
      z.object({
        filter: z.array(z.number()),
      }),
    );

    expect(result).toBeInstanceOf(ZodError);
  });
});
