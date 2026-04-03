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
  "simplicity-reviewer",
  "AGENT.md",
);

describe("simplicity-reviewer AGENT.md", () => {
  it("file exists and is non-empty", () => {
    expect(existsSync(AGENT_PATH)).toBe(true);
    const content = readFileSync(AGENT_PATH, "utf8");
    expect(content.length).toBeGreaterThan(0);
  });

  describe("YAML frontmatter", () => {
    it("contains frontmatter with name: simplicity-reviewer", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toMatch(/^---\n/u);
      expect(content).toContain("name: simplicity-reviewer");
    });
  });

  describe("review criteria", () => {
    it("specifies over-abstraction criterion", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("over-abstraction");
    });

    it("specifies premature generalization criterion", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("premature generalization");
    });

    it("specifies dead code criterion", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("dead code");
    });

    it("specifies redundant logic criterion", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("redundant logic");
    });

    it("specifies YAGNI criterion", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("YAGNI");
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
    it("returns PASS with OUT_OF_SCOPE for non-simplicity diffs", () => {
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
      expect(content).toContain("never interacts with pairs directly");
    });
  });
});
