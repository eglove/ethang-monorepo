import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const LIBRARIAN_DIR = resolve(import.meta.dirname, "../../../docs/librarian");
const INDEX_PATH = resolve(LIBRARIAN_DIR, "INDEX.md");
const PACKAGES_PATH = resolve(LIBRARIAN_DIR, "packages.md");
const SKILLS_PATH = resolve(LIBRARIAN_DIR, "skills.md");
const CLAUDE_DIR = resolve(import.meta.dirname, "../../../.claude");

describe("librarian index seed files", () => {
  it("should have INDEX.md with at least two category entries", () => {
    const content = readFileSync(INDEX_PATH, "utf8");
    expect(content.toLowerCase()).toContain("packages");
    expect(content.toLowerCase()).toContain("skills");
  });

  it("should have packages.md with Path/Kind/Summary/Updated table headers", () => {
    const content = readFileSync(PACKAGES_PATH, "utf8");
    expect(content).toContain("Path");
    expect(content).toContain("Kind");
    expect(content).toContain("Summary");
    expect(content).toContain("Updated");
  });

  it("should have skills.md with Path/Kind/Summary/Updated table headers", () => {
    const content = readFileSync(SKILLS_PATH, "utf8");
    expect(content).toContain("Path");
    expect(content).toContain("Kind");
    expect(content).toContain("Summary");
    expect(content).toContain("Updated");
  });

  it("should have no internal_map references in .claude/", () => {
    const checkDir = (dirPath: string): void => {
      const entries = readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = resolve(dirPath, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "worktrees") {
            checkDir(fullPath);
          }
        } else if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".ts"))) {
          const fileContent = readFileSync(fullPath, "utf8");
          expect(
            fileContent.toLowerCase().includes("internal_map"),
            `File ${fullPath} contains internal_map reference`,
          ).toBe(false);
        }
      }
    };

    checkDir(CLAUDE_DIR);
  });
});
