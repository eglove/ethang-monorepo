import { describe, expect, it } from "vitest";

import { generateDocument, generateDocumentMap } from "./generate-document.js";

describe("generateDocument", () => {
  it("should work", () => {
    expect(
      // cspell:disable-next-line
      generateDocument("Bste!hetsi ogEAxpelrt x ", "AlgoExpert is the Best!"),
    ).toBe(true);
  });

  it("should work with map version", () => {
    expect(
      generateDocumentMap(
        // cspell:disable-next-line
        "Bste!hetsi ogEAxpelrt x ",
        "AlgoExpert is the Best!",
      ),
    ).toBe(true);
  });
});
