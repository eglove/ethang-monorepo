import { describe, expect, it } from "vitest";

import { getNumberMeta } from "../../src/number/get-number-meta.js";

describe("getNumberMeta", () => {
  it.each([
    [
      {
        options: {
          currency: "USD",
          style: "currency",
        },
        value: `${Number.MAX_SAFE_INTEGER}.000000${Number.MAX_SAFE_INTEGER}`,
      },
      ["$9,007,199,254,740,991.00"],
    ],
    [
      {
        options: {
          currency: "USD",
          style: "currency",
        },
        value: `${Number.MAX_SAFE_INTEGER}.000${Number.MAX_SAFE_INTEGER}`,
      },
      ["$9,007,199,254,740,991.00"],
    ],
    [
      {
        options: {
          currency: "USD",
          style: "currency",
        },
        value: 0.000_000_001,
      },
      ["$0.0", "7", "10"],
    ],
    [
      {
        options: {
          currency: "USD",
          maximumFractionDigits: 10,
          style: "currency",
        },
        value: 0.0001,
      },
      ["$0.0001"],
    ],
  ])("should work", (
    input, expected,
  ) => {
    // @ts-expect-error for test
    const value = getNumberMeta(input);

    expect(value).toStrictEqual(expected);
  });
});
