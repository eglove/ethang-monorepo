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
  "artifact-reviewer",
  "AGENT.md",
);

describe("artifact-reviewer AGENT.md", () => {
  it("file exists and is non-empty", () => {
    expect(existsSync(AGENT_PATH)).toBe(true);
    const content = readFileSync(AGENT_PATH, "utf8");
    expect(content.length).toBeGreaterThan(0);
  });

  describe("YAML frontmatter", () => {
    it("contains frontmatter with name: artifact-reviewer", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toMatch(/^---\n/);
      expect(content).toContain("name: artifact-reviewer");
    });
  });

  describe("review criteria", () => {
    it("specifies directory structure criterion", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("Directory structure");
    });

    it("specifies naming conventions criterion", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("Naming conventions");
    });

    it("specifies file presence criterion", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("File presence");
    });

    it("specifies scope boundaries criterion", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("Scope boundaries");
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
    it("returns PASS with OUT_OF_SCOPE for non-artifact diffs", () => {
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

  describe("severity levels", () => {
    it("contains ERROR severity", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("ERROR");
    });

    it("contains WARNING severity", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("WARNING");
    });

    it("contains INFO severity", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("INFO");
    });

    it("includes severity in findings structure", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("severity:");
    });
  });
});
