import { describe, expect, it } from "vitest";

import { generateDocument, generateDocumentMap } from "./generate-document.js";

describe("generateDocument", () => {
  it("should work", () => {
    expect(
    // eslint-disable-next-line cspell/spellchecker
      generateDocument("Bste!hetsi ogEAxpelrt x ", "AlgoExpert is the Best!"),
    ).toBe(true);
  });

  it("should work with map version", () => {
    expect(
      // eslint-disable-next-line cspell/spellchecker
      generateDocumentMap("Bste!hetsi ogEAxpelrt x ", "AlgoExpert is the Best!"),
    ).toBe(true);
  });
});
