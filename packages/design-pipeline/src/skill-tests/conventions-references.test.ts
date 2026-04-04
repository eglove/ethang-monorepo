import split from "lodash/split.js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.join(import.meta.dirname, "..", "..", "..", "..");

const FILES = [
  ".claude/skills/agents/expert-continuous-delivery/SKILL.md",
  ".claude/skills/agents/expert-edge-cases/SKILL.md",
  ".claude/skills/agents/expert-performance/SKILL.md",
  ".claude/skills/hono-writer/AGENT.md",
  ".claude/skills/typescript-writer/AGENT.md",
  ".claude/skills/ui-writer/AGENT.md",
  ".claude/skills/playwright-writer/AGENT.md",
  ".claude/skills/trainer/AGENT.md",
  ".claude/skills/implementation-writer/AGENT.md",
  ".claude/skills/project-manager/AGENT.md",
  ".claude/skills/progressive-mapper.md",
] as const;

const MAX_HEADER_LINES = 20;

describe("conventions references — cleanup verification", () => {
  for (const file of FILES) {
    describe(file, () => {
      const fullPath = path.join(ROOT, file);
      const content = readFileSync(fullPath, "utf8");

      it("does NOT contain a Read shared conventions instruction", () => {
        expect(content).not.toContain("Read shared conventions");
      });

      it("does NOT reference conventions.md in the first header lines", () => {
        const lines = split(content, "\n").slice(0, MAX_HEADER_LINES);
        const headerBlock = lines.join("\n");

        expect(headerBlock).not.toMatch(
          /Read shared conventions.*conventions\.md/u,
        );
      });

      it("uses LF line endings", () => {
        expect(content).not.toContain("\r\n");
      });
    });
  }
});
