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

describe("questioner SKILL.md — freeform discovery", () => {
  it("does not contain fixed Decision Tree section", () => {
    expect(content).not.toMatch(/### Decision Tree/u);
  });

  it("contains Freeform Discovery section", () => {
    expect(content).toMatch(/### Freeform Discovery/u);
  });

  it("does not contain 'Expert council' branch", () => {
    expect(content).not.toMatch(/expert council/iu);
  });

  it("does not contain '**11.**' numbering", () => {
    expect(content).not.toMatch(/\*\*11\.\*\*/u);
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

  it("contains completeness check before sign-off", () => {
    expect(content).toMatch(/completeness check/iu);
  });

  it("contains hard turn cap (MaxTurns)", () => {
    expect(content).toMatch(/MaxTurns:\s*50/u);
  });

  it("retains one question per message rule", () => {
    expect(content).toMatch(/one question per message/iu);
  });

  it("Decision Guide does not contain 'User adjusts expert list during sign-off' row", () => {
    expect(content).not.toMatch(/user adjusts expert list during sign-off/iu);
  });
});
