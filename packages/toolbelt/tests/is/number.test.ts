import { describe, expect, it } from "vitest";

import { isNumber } from "../../src/is/number.ts";

describe("isNumber", () => {
  it.each([123, "123", 0, -123, 3.4])("should return true for %s", (value) => {
    expect(isNumber(value)).toBe(true);
  });
});
