import { describe, expect, it } from "vitest";

import { commonCharacters } from "./common-characters.js";

describe("commonCharacters", () => {
  it("should work", () => {
    expect(commonCharacters(["abc", "bcd", "cbaccd"])).toStrictEqual([
      "b",
      "c",
    ]);
  });
});
