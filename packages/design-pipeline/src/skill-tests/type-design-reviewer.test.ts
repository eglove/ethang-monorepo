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
  "type-design-reviewer",
  "AGENT.md",
);

describe("type-design-reviewer AGENT.md", () => {
  it("file exists and is non-empty", () => {
    expect(existsSync(AGENT_PATH)).toBe(true);
    const content = readFileSync(AGENT_PATH, "utf8");
    expect(content.length).toBeGreaterThan(0);
  });

  describe("YAML frontmatter", () => {
    it("contains frontmatter with name: type-design-reviewer", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toMatch(/^---\n/);
      expect(content).toContain("name: type-design-reviewer");
    });
  });

  describe("TLA+ spec input", () => {
    it("specifies TLA+ spec as required input for invariant checking", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toMatch(/TLA\+/);
      expect(content).toContain("invariant");
    });
  });

  describe("review criteria", () => {
    it("specifies discriminated unions criterion", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("discriminated unions");
    });

    it("specifies any/unknown avoidance criterion", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("any");
      expect(content).toContain("unknown");
    });

    it("specifies type narrowing criterion", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("type narrowing");
    });

    it("specifies naming criterion", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("naming");
    });

    it("specifies TLA+ alignment criterion", () => {
      const content = readFileSync(AGENT_PATH, "utf8");
      expect(content).toContain("TLA+ alignment");
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
    it("returns PASS with OUT_OF_SCOPE for non-type diffs", () => {
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
