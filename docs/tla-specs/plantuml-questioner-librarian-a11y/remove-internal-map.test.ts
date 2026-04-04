import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const CLAUDE_DIR = resolve(import.meta.dirname, "../../../.claude");

describe("no internal_map references in .claude/", () => {
  it("should have zero internal_map references in any .claude/ file", () => {
    const violations: string[] = [];

    const checkDir = (dirPath: string): void => {
      const entries = readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = resolve(dirPath, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "worktrees" && entry.name !== "node_modules") {
            checkDir(fullPath);
          }
        } else if (entry.isFile()) {
          const fileContent = readFileSync(fullPath, "utf8");
          if (fileContent.toLowerCase().includes("internal_map")) {
            violations.push(fullPath);
          }
        }
      }
    };

    checkDir(CLAUDE_DIR);
    expect(
      violations,
      `Files with internal_map references: ${violations.join(", ")}`,
    ).toHaveLength(0);
  });
});
