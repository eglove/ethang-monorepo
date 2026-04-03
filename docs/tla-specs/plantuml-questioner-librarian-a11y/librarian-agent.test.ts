import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const AGENT_PATH = resolve(
  import.meta.dirname,
  "../../../.claude/skills/agents/librarian/AGENT.md",
);

describe("librarian agent AGENT.md", () => {
  it("should exist at the expected path", () => {
    expect(() => {
      readFileSync(AGENT_PATH, "utf8");
    }).not.toThrow();
  });

  it("should mention Shared Kernel pattern", () => {
    const content = readFileSync(AGENT_PATH, "utf8");
    expect(content).toContain("Shared Kernel");
  });

  it("should define Markdown table schema with Path column", () => {
    const content = readFileSync(AGENT_PATH, "utf8");
    expect(content).toContain("Path");
  });

  it("should define Markdown table schema with Kind column", () => {
    const content = readFileSync(AGENT_PATH, "utf8");
    expect(content).toContain("Kind");
  });

  it("should define Markdown table schema with Summary column", () => {
    const content = readFileSync(AGENT_PATH, "utf8");
    expect(content).toContain("Summary");
  });

  it("should define Markdown table schema with Updated column", () => {
    const content = readFileSync(AGENT_PATH, "utf8");
    expect(content).toContain("Updated");
  });

  it("should specify split threshold as configurable with default value", () => {
    const content = readFileSync(AGENT_PATH, "utf8");
    const hasSplitThreshold =
      content.includes("split threshold") ||
      content.includes("SplitThreshold") ||
      content.includes("Split threshold");
    expect(hasSplitThreshold).toBe(true);
    expect(content).toMatch(/2[,.]?000/);
  });

  it("should describe graceful degradation for stale/partial/corrupt index states", () => {
    const content = readFileSync(AGENT_PATH, "utf8");
    const lowerContent = content.toLowerCase();
    expect(lowerContent).toContain("stale");
    expect(lowerContent).toContain("partial");
    expect(lowerContent).toContain("corrupt");
  });

  it("should reference docs/librarian/INDEX.md as root file", () => {
    const content = readFileSync(AGENT_PATH, "utf8");
    expect(content).toContain("docs/librarian/INDEX.md");
  });
});
