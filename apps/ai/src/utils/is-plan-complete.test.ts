import { describe, expect, it } from "vitest";

import { isPlanComplete } from "./is-plan-complete.js";

describe("isPlanComplete", () => {
  it("returns true when content contains both '# Plan' and '## '", () => {
    expect(isPlanComplete("# Plan\n\n## Introduction\n\nSome text.")).toBe(
      true
    );
  });

  it("returns false when content has '# Plan' but no '## '", () => {
    expect(isPlanComplete("# Plan\n\nSome text without headings.")).toBe(false);
  });

  it("returns false when content has '## ' but no '# Plan'", () => {
    expect(isPlanComplete("## Introduction\n\nSome text.")).toBe(false);
  });

  it("returns false when content is empty", () => {
    expect(isPlanComplete("")).toBe(false);
  });

  it("returns false when content has neither marker", () => {
    expect(isPlanComplete("Just some plain text.")).toBe(false);
  });

  it("returns true when markers appear deep in the content", () => {
    expect(
      isPlanComplete("Preamble\n# Plan\n\n## Section 1\n## Section 2\n")
    ).toBe(true);
  });

  it("returns true when '###' is present because it contains '## ' as substring", () => {
    // The function uses String.includes, so "###" matches "## "
    expect(isPlanComplete("# Plan\n\n### Not a level-2 heading")).toBe(true);
  });
});
