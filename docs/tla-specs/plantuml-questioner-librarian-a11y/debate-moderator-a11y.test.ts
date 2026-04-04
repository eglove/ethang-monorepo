import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const SKILL_PATH = resolve(
  import.meta.dirname,
  "../../../.claude/skills/orchestrators/debate-moderator/SKILL.md",
);

const content = readFileSync(SKILL_PATH, "utf8");

describe("debate-moderator a11y selection criteria", () => {
  it("should include expert-a11y in the expert roster", () => {
    expect(content).toContain("expert-a11y");
  });

  it("should document UI/frontend selection criteria keywords", () => {
    const lowerContent = content.toLowerCase();
    const hasUI = lowerContent.includes("ui");
    const hasFrontend = lowerContent.includes("frontend");
    const hasComponent = lowerContent.includes("component");
    const hasAccessibility = lowerContent.includes("accessibility");
    expect(hasUI && hasFrontend && hasComponent && hasAccessibility).toBe(
      true,
    );
  });

  it("should document exclusion criteria for backend-only topics", () => {
    const lowerContent = content.toLowerCase();
    expect(lowerContent).toContain("backend");
  });

  it("should document mixed-scope inclusion", () => {
    const lowerContent = content.toLowerCase();
    expect(lowerContent).toContain("mixed");
  });
});
