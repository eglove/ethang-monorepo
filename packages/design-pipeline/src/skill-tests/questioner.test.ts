import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SKILL_PATH = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  ".claude",
  "skills",
  "questioner",
  "SKILL.md",
);

const content = readFileSync(SKILL_PATH, "utf8");

describe("questioner SKILL.md — branch 11 removed", () => {
  it("Decision Tree does not contain 'Expert council' branch", () => {
    const decisionTreeMatch = /### Decision Tree[\S\s]*?(?=##\s|$)/u.exec(
      content,
    );
    const decisionTree = decisionTreeMatch?.[0] ?? content;
    expect(decisionTree).not.toMatch(/expert council/iu);
  });

  it("Decision Tree does not contain '**11.**' numbering", () => {
    const decisionTreeMatch = /### Decision Tree[\S\s]*?(?=##\s|$)/u.exec(
      content,
    );
    const decisionTree = decisionTreeMatch?.[0] ?? content;
    expect(decisionTree).not.toMatch(/\*\*11\.\*\*/u);
  });

  it("Decision Tree does not contain bare '11.' followed by expert council content", () => {
    const decisionTreeMatch = /### Decision Tree[\S\s]*?(?=##\s|$)/u.exec(
      content,
    );
    const decisionTree = decisionTreeMatch?.[0] ?? content;
    expect(decisionTree).not.toMatch(/11\.\s+\*\*Expert/u);
  });

  it("Phase 3 sign-off does not contain 'expert council recommendation'", () => {
    expect(content).not.toMatch(/expert council recommendation/iu);
  });

  it("Output Format session file template does not contain '## Expert Council'", () => {
    expect(content).not.toMatch(/^## Expert Council/mu);
  });

  it("Output Format session file template still contains '## Debate Requested'", () => {
    expect(content).toMatch(/## Debate Requested/u);
  });

  it("role description states questioner handles requirements elicitation through branches 1-10", () => {
    expect(content).toMatch(/1[-\u2013]10/u);
  });

  it("Decision Guide does not contain 'User adjusts expert list during sign-off' row", () => {
    expect(content).not.toMatch(/user adjusts expert list during sign-off/iu);
  });
});
