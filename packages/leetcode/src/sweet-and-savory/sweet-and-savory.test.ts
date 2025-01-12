import { describe, expect, it } from "vitest";

import { sweetAndSavory } from "./sweet-and-savory.js";

describe("sweetAndSavory", () => {
  it("should work", () => {
    expect(sweetAndSavory([5, 2, -7, 30, 12, -4, -20], 4))
      .toStrictEqual([-4, 5]);
  });
});
