import { describe, expect, it } from "vitest";

import {
  parseCoverageSummary,
  summarizeCoverage
} from "../src/domain/coverage-summary.ts";

describe("coverage-summary domain", () => {
  describe(parseCoverageSummary, () => {
    it("parses a well-formed vitest coverage-summary.json", () => {
      const raw = JSON.stringify({
        branches: { covered: 90, pct: 95, total: 100 },
        functions: { covered: 50, pct: 100, total: 50 },
        lines: { covered: 200, pct: 100, total: 200 },
        statements: { covered: 200, pct: 100, total: 200 }
      });

      const summary = parseCoverageSummary(raw);

      expect(summary.branches).toStrictEqual({
        covered: 90,
        pct: 95,
        total: 100
      });
      expect(summary.lines.pct).toBe(100);
    });

    it("ignores unrelated keys at the root", () => {
      const raw = JSON.stringify({
        branches: { covered: 1, pct: 100, total: 1 },
        extra: "ignored",
        functions: { covered: 1, pct: 100, total: 1 },
        lines: { covered: 1, pct: 100, total: 1 },
        statements: { covered: 1, pct: 100, total: 1 }
      });

      const summary = parseCoverageSummary(raw);

      expect(summary.branches.covered).toBe(1);
    });
  });

  describe(summarizeCoverage, () => {
    it("sums covered and total across all four metrics", () => {
      const summary = parseCoverageSummary(
        JSON.stringify({
          branches: { covered: 8, pct: 80, total: 10 },
          functions: { covered: 5, pct: 100, total: 5 },
          lines: { covered: 20, pct: 100, total: 20 },
          statements: { covered: 30, pct: 100, total: 30 }
        })
      );

      const { covered, total } = summarizeCoverage(summary);

      expect(covered).toBe(63);
      expect(total).toBe(65);
    });
  });

  describe("parseCoverageSummary error messages", () => {
    it.each([
      {
        expectedPattern: /Expected.*actual \[\]/u,
        label: "non-object root (array)",
        raw: "[]"
      },
      {
        expectedPattern: /\["functions"\]\s+└─ is missing/u,
        label: "missing metric",
        raw: JSON.stringify({
          branches: { covered: 1, pct: 100, total: 1 }
        })
      },
      {
        expectedPattern: /Expected number, actual "100"/u,
        label: "malformed metric field",
        raw: JSON.stringify({
          branches: { covered: 1, pct: "100", total: 1 },
          functions: { covered: 1, pct: 100, total: 1 },
          lines: { covered: 1, pct: 100, total: 1 },
          statements: { covered: 1, pct: 100, total: 1 }
        })
      },
      {
        expectedPattern: /Expected .*actual \[\]/u,
        label: "array-valued metric",
        raw: JSON.stringify({
          branches: [],
          functions: { covered: 1, pct: 100, total: 1 },
          lines: { covered: 1, pct: 100, total: 1 },
          statements: { covered: 1, pct: 100, total: 1 }
        })
      }
    ])("throws $expectedPattern when $label", ({ expectedPattern, raw }) => {
      expect(() => {
        parseCoverageSummary(raw);
      }).toThrow(expectedPattern);
    });
  });
});
