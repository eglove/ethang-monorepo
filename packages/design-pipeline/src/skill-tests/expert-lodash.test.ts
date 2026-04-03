import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SKILL_PATH = path.join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  ".claude",
  "skills",
  "agents",
  "expert-lodash",
  "SKILL.md",
);

const content = readFileSync(SKILL_PATH, "utf8").replaceAll("\r\n", "\n");

const frontmatterMatch = /^---\r?\n([\S\s]*?)\r?\n---/u.exec(content);
const frontmatter = frontmatterMatch?.[1] ?? "";
const body = frontmatterMatch
  ? content.slice(frontmatterMatch[0].length)
  : content;

describe("expert-lodash SKILL.md", () => {
  it("frontmatter contains name: expert-lodash", () => {
    expect(frontmatter).toContain("name: expert-lodash");
  });

  it("contains a ## Role heading", () => {
    expect(body).toContain("## Role");
  });

  it("contains a ## Shared Values heading", () => {
    expect(body).toContain("## Shared Values");
  });

  it("contains a ## When to Dispatch heading", () => {
    expect(body).toContain("## When to Dispatch");
  });

  it("contains a ## Expected Inputs heading", () => {
    expect(body).toContain("## Expected Inputs");
  });

  it("contains a ## Process heading", () => {
    expect(body).toContain("## Process");
  });

  it("contains an ## Output Format heading", () => {
    expect(body).toContain("## Output Format");
  });

  it("contains a ## Handoff heading", () => {
    expect(body).toContain("## Handoff");
  });

  it("contains the string 'lodash' at least once in body", () => {
    expect(body).toMatch(/lodash/iu);
  });

  it("does NOT contain name: expert-tdd (regression: correct file, not a copy)", () => {
    expect(frontmatter).not.toContain("name: expert-tdd");
  });
});
