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
  "backlog-reviewer",
  "AGENT.md",
);

describe("backlog-reviewer AGENT.md", () => {
  it("file exists and is non-empty", () => {
    expect(existsSync(AGENT_PATH)).toBe(true);
    const content = readFileSync(AGENT_PATH, "utf8");
    expect(content.length).toBeGreaterThan(0);
  });

  describe("YAML frontmatter", () => {
    it("contains frontmatter with name: backlog-reviewer", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toMatch(/^---\n/);
      expect(content).toContain("name: backlog-reviewer");
    });
  });

  describe("verdict is always PASS", () => {
    it("specifies verdict is always PASS", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("always PASS");
    });

    it("never returns FAIL", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("never returns FAIL");
    });

    it("findings go to user_notes, not the pair", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("docs/user_notes/");
    });
  });

  describe("review scope", () => {
    it("covers refactoring opportunities", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("refactoring");
    });

    it("covers performance", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("performance");
    });

    it("covers accessibility", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("accessibility");
    });

    it("covers documentation", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("documentation");
    });

    it("covers test coverage", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("test coverage");
    });
  });

  describe("self-scoping rule", () => {
    it("scopes findings to session diff", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("session diff");
    });

    it("routes pre-existing issues to user_notes", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("user_notes");
    });
  });

  describe("out-of-domain behavior", () => {
    it("returns PASS with OUT_OF_SCOPE", () => {
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

  describe("user_notes output destination", () => {
    it("specifies user_notes as output destination for observations", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("user_notes");
      expect(content).toContain("observations");
    });
  });

  describe("interaction protocol", () => {
    it("never interacts with pairs directly", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("never interacts with pairs directly");
    });
  });
});
