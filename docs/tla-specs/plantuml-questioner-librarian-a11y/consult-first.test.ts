import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const CONVENTIONS_PATH = resolve(
  import.meta.dirname,
  "../../../.claude/skills/shared/conventions.md",
);

const content = readFileSync(CONVENTIONS_PATH, "utf8");

describe("shared conventions consult-first pattern", () => {
  it("should contain consult-first instruction", () => {
    const hasConsultFirst =
      content.includes("consult first") ||
      content.includes("consult-first") ||
      content.includes("Consult First") ||
      content.includes("Consult-First");
    expect(hasConsultFirst).toBe(true);
  });

  it("should reference docs/librarian/INDEX.md", () => {
    expect(content).toContain("docs/librarian/INDEX.md");
  });

  it("should mention fallback to direct file reads when index unavailable", () => {
    const lowerContent = content.toLowerCase();
    const hasFallback =
      lowerContent.includes("fallback") || lowerContent.includes("fall back");
    expect(hasFallback).toBe(true);
  });

  it("should mention Shared Kernel as the named pattern", () => {
    expect(content).toContain("Shared Kernel");
  });
});
