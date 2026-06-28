import { describe, expect, it } from "vitest";

import { parsePlanSections } from "./parse-plan-sections.js";

describe("parsePlanSections", () => {
  it("parses a single h2 section", () => {
    const result = parsePlanSections("## Title\n\nContent here.");
    expect(result).toEqual([{ content: "Content here.", title: "Title" }]);
  });

  it("parses multiple h2 sections", () => {
    const input = "## First\n\nFirst content.\n\n## Second\n\nSecond content.";
    const result = parsePlanSections(input);
    expect(result).toEqual([
      { content: "First content.", title: "First" },
      { content: "Second content.", title: "Second" }
    ]);
  });

  it("skips h1 lines", () => {
    const input = "# Plan\n\n## Section\n\nContent.";
    const result = parsePlanSections(input);
    expect(result).toEqual([{ content: "Content.", title: "Section" }]);
  });

  it("returns empty array when input is empty", () => {
    expect(parsePlanSections("")).toEqual([]);
  });

  it("returns empty array when there are no h2 headings", () => {
    expect(parsePlanSections("Just plain text\nwith no headings.")).toEqual([]);
  });

  it("treats content before the first h2 as skipped", () => {
    const input = "Preamble text.\n\n## First\n\nContent.";
    const result = parsePlanSections(input);
    expect(result).toEqual([{ content: "Content.", title: "First" }]);
  });

  it("handles a section with trailing whitespace", () => {
    const result = parsePlanSections("## Title\n\nContent.  \n\n");
    expect(result).toEqual([{ content: "Content.", title: "Title" }]);
  });

  it("handles multiple blank lines between sections", () => {
    const input = "## A\n\nA content.\n\n\n\n## B\n\nB content.";
    const result = parsePlanSections(input);
    expect(result).toEqual([
      { content: "A content.", title: "A" },
      { content: "B content.", title: "B" }
    ]);
  });

  it("handles h2 title with surrounding spaces", () => {
    const result = parsePlanSections("##   Spaced Title  \n\nContent.");
    expect(result).toEqual([{ content: "Content.", title: "Spaced Title" }]);
  });

  it("preserves multi-line content within a section", () => {
    const input = "## Section\n\nLine 1.\nLine 2.\nLine 3.";
    const result = parsePlanSections(input);
    expect(result).toEqual([
      { content: "Line 1.\nLine 2.\nLine 3.", title: "Section" }
    ]);
  });
});
