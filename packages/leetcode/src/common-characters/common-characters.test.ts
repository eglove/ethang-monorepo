import { describe, expect, it } from "vitest";

import { commonCharacters } from "./common-characters.js";

describe("commonCharacters", () => {
  it("should work", () => {
    // eslint-disable-next-line cspell/spellchecker
    expect(commonCharacters(["abc", "bcd", "cbaccd"])).toStrictEqual(["b", "c"]);
  });
});
