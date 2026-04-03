import includes from "lodash/includes.js";
import { readFileSync } from "node:fs";
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
  "security-reviewer",
  "AGENT.md",
);

const content = readFileSync(AGENT_PATH, "utf8");

describe("security-reviewer AGENT.md", () => {
  it("exists and is non-empty", () => {
    expect(content.length).toBeGreaterThan(0);
  });

  it("has YAML frontmatter with name: security-reviewer", () => {
    expect(content).toMatch(/^---\n[\s\S]*?name:\s*security-reviewer[\s\S]*?---/);
  });

  it("requires checking for hardcoded secrets", () => {
    expect(includes(content, "hardcoded secrets")).toBe(true);
  });

  it("requires checking for path traversal", () => {
    expect(includes(content, "path traversal")).toBe(true);
  });

  it("requires checking for injection", () => {
    expect(includes(content, "injection")).toBe(true);
  });

  it("requires checking for input validation", () => {
    expect(includes(content, "input validation")).toBe(true);
  });

  it("requires checking for insecure defaults", () => {
    expect(includes(content, "insecure defaults")).toBe(true);
  });

  it("requires checking for data exposure", () => {
    expect(includes(content, "data exposure")).toBe(true);
  });

  it("self-scopes to session diff only", () => {
    expect(includes(content, "session diff")).toBe(true);
  });

  it("routes pre-existing issues to user_notes", () => {
    expect(includes(content, "user_notes")).toBe(true);
  });

  it("handles out-of-domain with PASS and OUT_OF_SCOPE", () => {
    expect(includes(content, "PASS")).toBe(true);
    expect(includes(content, "OUT_OF_SCOPE")).toBe(true);
  });

  it("uses structured ReviewVerdict with verdict, scope, and findings", () => {
    expect(includes(content, "ReviewVerdict")).toBe(true);
    expect(includes(content, "verdict")).toBe(true);
    expect(includes(content, "scope")).toBe(true);
    expect(includes(content, "findings")).toBe(true);
  });

  it("never interacts with pairs directly", () => {
    expect(includes(content, "never interacts with pairs directly")).toBe(true);
  });
});
