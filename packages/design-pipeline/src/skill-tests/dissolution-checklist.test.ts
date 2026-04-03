import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const CHECKLIST_PATH = path.join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  "docs",
  "implementation",
  "2026-04-03_dissolution-checklist.md",
);

const SECTION_NAMES = [
  "Line Endings",
  "ESLint Config",
  "Vitest Coverage Thresholds",
  "CSpell Unknown Words",
  "TDD",
  "DDD",
  "Atomic Design",
  "BDD",
  "Lodash",
  "State Machine Mindset",
  "No Repeated String Literals",
  "Feature Development Agents",
  "Opportunistic Code Improvement",
  "Progressive Mapping",
] as const;

const EXPECTED_ROW_COUNT = 14;
const TABLE_ROW_PATTERN = /^\|[^|]+\|[^|]+\|[^|]+\|$/gmu;
const SEPARATOR_PATTERN = /^\|[-\s|]+\|$/u;
const DESTINATION_CELL_PATTERN = /^\|[^|]+\|\s*([^|]+?)\s*\|[^|]+\|$/u;

const content = readFileSync(CHECKLIST_PATH, "utf8");

describe("dissolution checklist", () => {
  it("file exists and is non-empty", () => {
    expect(content.length).toBeGreaterThan(0);
  });

  it("contains exactly 14 data rows in the table", () => {
    const allRows = content.match(TABLE_ROW_PATTERN) ?? [];
    const dataRows = allRows.filter((row) => {
      return !SEPARATOR_PATTERN.test(row.trim());
    });
    const headerRow = 1;
    expect(dataRows.length - headerRow).toBe(EXPECTED_ROW_COUNT);
  });

  for (const section of SECTION_NAMES) {
    it(`contains section "${section}"`, () => {
      expect(content).toContain(section);
    });
  }

  it("every row has a non-empty destination file path", () => {
    const allRows = content.match(TABLE_ROW_PATTERN) ?? [];
    const dataRows = allRows.filter((row) => {
      return !SEPARATOR_PATTERN.test(row.trim());
    });
    const rowsWithoutHeader = dataRows.slice(1);

    for (const row of rowsWithoutHeader) {
      const match = DESTINATION_CELL_PATTERN.exec(row);
      expect(match).not.toBeNull();
      const destination = match?.[1]?.trim() ?? "";
      expect(destination.length).toBeGreaterThan(0);
    }
  });

  it("does not contain CRLF line endings", () => {
    expect(content).not.toContain("\r\n");
  });
});
