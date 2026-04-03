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
  "bug-reviewer",
  "AGENT.md",
);

describe("bug-reviewer AGENT.md", () => {
  it("file exists and is non-empty", () => {
    expect(existsSync(AGENT_PATH)).toBe(true);
    const content = readFileSync(AGENT_PATH, "utf8");
    expect(content.length).toBeGreaterThan(0);
  });

  describe("YAML frontmatter", () => {
    it("contains frontmatter with name: bug-reviewer", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toMatch(/^---\n/);
      expect(content).toContain("name: bug-reviewer");
    });
  });

  describe("review criteria", () => {
    it("specifies logic errors criterion", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content.toLowerCase()).toContain("logic error");
    });

    it("specifies off-by-one criterion", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content.toLowerCase()).toContain("off-by-one");
    });

    it("specifies null handling criterion", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content.toLowerCase()).toContain("null");
    });

    it("specifies race conditions criterion", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content.toLowerCase()).toContain("race condition");
    });

    it("specifies incorrect assumptions criterion", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content.toLowerCase()).toContain("incorrect assumption");
    });
  });

  describe("inputs", () => {
    it("specifies git history as input", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content.toLowerCase()).toContain("git history");
    });

    it("specifies PR context as input", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toMatch(/PR context/i);
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
    it("returns PASS with OUT_OF_SCOPE when out of domain", () => {
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
