import { describe, expect, it } from "vitest";

import { parseCoverageSummary } from "../src/domain/coverage-summary.ts";
import {
  checkCoverageThresholds,
  DEFAULT_THRESHOLDS,
  isCoveragePassing
} from "../src/domain/coverage-thresholds.ts";

const DEFAULT_THRESHOLDS_DESCRIPTION = "DEFAULT_THRESHOLDS";

const SUMMARY = (overrides: {
  branches?: number;
  functions?: number;
  lines?: number;
  statements?: number;
}) => {
  return parseCoverageSummary(
    JSON.stringify({
      branches: {
        covered: 0,
        pct: overrides.branches ?? 100,
        total: 1
      },
      functions: {
        covered: 0,
        pct: overrides.functions ?? 100,
        total: 1
      },
      lines: {
        covered: 0,
        pct: overrides.lines ?? 100,
        total: 1
      },
      statements: {
        covered: 0,
        pct: overrides.statements ?? 100,
        total: 1
      }
    })
  );
};

describe("coverage-thresholds domain", () => {
  describe(DEFAULT_THRESHOLDS_DESCRIPTION, () => {
    it("requires 100% on every metric", () => {
      expect(DEFAULT_THRESHOLDS).toStrictEqual({
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100
      });
    });
  });

  describe(checkCoverageThresholds, () => {
    it("returns no violations when every metric meets the default 100%", () => {
      expect(checkCoverageThresholds(SUMMARY({}))).toStrictEqual([]);
    });

    it("flags a single underperforming metric with actual and required", () => {
      const violations = checkCoverageThresholds(SUMMARY({ branches: 95 }));

      expect(violations).toStrictEqual([
        { actual: 95, metric: "branches", required: 100 }
      ]);
    });

    it("flags multiple underperforming metrics", () => {
      const violations = checkCoverageThresholds(
        SUMMARY({ branches: 80, lines: 75 })
      );

      expect(violations).toStrictEqual(
        expect.arrayContaining([
          { actual: 80, metric: "branches", required: 100 },
          { actual: 75, metric: "lines", required: 100 }
        ])
      );
      expect(violations).toHaveLength(2);
    });

    it("respects custom thresholds", () => {
      expect(
        checkCoverageThresholds(SUMMARY({ lines: 90 }), {
          branches: 100,
          functions: 100,
          lines: 85,
          statements: 100
        })
      ).toStrictEqual([]);
    });

    it("treats equality as passing", () => {
      const violations = checkCoverageThresholds(SUMMARY({ lines: 85 }), {
        branches: 100,
        functions: 100,
        lines: 85,
        statements: 100
      });

      expect(violations).toStrictEqual([]);
    });
  });

  describe(isCoveragePassing, () => {
    it("returns true when no violations are present", () => {
      expect(isCoveragePassing(SUMMARY({}))).toBe(true);
    });

    it("returns false when any metric is below the threshold", () => {
      expect(isCoveragePassing(SUMMARY({ functions: 99 }))).toBe(false);
    });
  });
});
