/**
Pure coverage-threshold gate.

Given a parsed `CoverageSummary` and the per-metric thresholds
(each expressed as a percentage 0-100), decide whether the build
passes. Mirrors the values declared in each package's
`vitest.config.ts` so the same logic can be used by the parent
PowerShell script and by individual vitest runs.
*/

import type { CoverageSummary } from "./coverage-summary.ts";

export type CoverageThresholds = {
  branches: number;
  functions: number;
  lines: number;
  statements: number;
};

export const DEFAULT_THRESHOLDS: CoverageThresholds = {
  branches: 100,
  functions: 100,
  lines: 100,
  statements: 100
};

export type ThresholdViolation = {
  actual: number;
  metric: keyof CoverageThresholds;
  required: number;
};

const METRIC_KEYS = [
  "branches",
  "functions",
  "lines",
  "statements"
] as const satisfies readonly (keyof CoverageThresholds)[];

export const checkCoverageThresholds = (
  summary: CoverageSummary,
  thresholds: CoverageThresholds = DEFAULT_THRESHOLDS
) => {
  const violations: ThresholdViolation[] = [];
  for (const metric of METRIC_KEYS) {
    const actual = summary[metric].pct;
    const required = thresholds[metric];
    if (actual < required) {
      violations.push({ actual, metric, required });
    }
  }
  return violations;
};

export const isCoveragePassing = (
  summary: CoverageSummary,
  thresholds: CoverageThresholds = DEFAULT_THRESHOLDS
) => {
  return 0 === checkCoverageThresholds(summary, thresholds).length;
};
