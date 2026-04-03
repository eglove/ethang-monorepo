import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const AGENT_PATH = path.join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  ".claude",
  "skills",
  "reviewers",
  "test-reviewer",
  "AGENT.md",
);

describe("test-reviewer AGENT.md", () => {
  it("file exists and is non-empty", () => {
    expect(existsSync(AGENT_PATH)).toBe(true);
    const content = readFileSync(AGENT_PATH, "utf8");
    expect(content.length).toBeGreaterThan(0);
  });

  describe("YAML frontmatter", () => {
    it("contains frontmatter with name: test-reviewer", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toMatch(/^---\n/);
      expect(content).toContain("name: test-reviewer");
    });
  });

  describe("differentiated scope — simulated integration merge", () => {
    it("specifies cherry-pick into temp branch for simulated merge", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toMatch(/cherry.pick/i);
      expect(content).toMatch(/temp.*branch/i);
    });

    it("specifies simulated integration merge as its core scope", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toMatch(/simulated.*merge/i);
    });
  });

  describe("not a duplication of existing reviews", () => {
    it("explicitly states NOT a duplication of LOCAL_REVIEW", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toMatch(/not.*(?:duplication|duplicate|replacement).*LOCAL_REVIEW/i);
    });

    it("explicitly states NOT a duplication of Phase 3 Verification", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toMatch(/not.*(?:duplication|duplicate|replacement).*Phase 3/i);
    });
  });

  describe("code execution — tests, lint, tsc", () => {
    it("specifies running tests against the simulated merge", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toMatch(/run.*test/i);
    });

    it("specifies running lint against the simulated merge", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toMatch(/lint/i);
    });

    it("specifies running tsc against the simulated merge", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("tsc");
    });

    it("is the ONLY reviewer that executes code", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toMatch(/only.*reviewer.*execut/i);
    });
  });

  describe("self-scoping rule", () => {
    it("scopes findings to session diff only", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("session diff only");
    });

    it("routes pre-existing issues to user_notes", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("user_notes");
    });
  });

  describe("out-of-domain behavior", () => {
    it("returns PASS with OUT_OF_SCOPE when not applicable", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("PASS");
      expect(content).toContain("OUT_OF_SCOPE");
    });
  });

  describe("structured ReviewVerdict output", () => {
    it("contains ReviewVerdict section", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("ReviewVerdict");
    });

    it("defines verdict field", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("verdict:");
    });

    it("defines scope field", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("scope:");
    });

    it("defines findings field", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("findings:");
    });
  });

  describe("interaction protocol", () => {
    it("never interacts with pairs directly", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toMatch(/never interacts with pairs directly/i);
    });
  });
});
