/**
Orchestrate a single vitest coverage-summary check.

Compose the pure `coverage-thresholds` gate with the IO wrapper
`fs-coverage.readCoverageSummary` to produce a structured pass/fail
result. The parent PowerShell script consumes this so the result
shape stays identical to the inline tsc/lint/test slots.
*/

import { Effect } from "effect";
import isNil from "lodash/isNil.js";

import {
  type CoverageSummary,
  summarizeCoverage
} from "../domain/coverage-summary.ts";
import {
  checkCoverageThresholds,
  type CoverageThresholds,
  DEFAULT_THRESHOLDS,
  isCoveragePassing,
  type ThresholdViolation
} from "../domain/coverage-thresholds.ts";
import { readCoverageSummary } from "../infrastructure/fs-coverage.ts";

export type RunCoverageOptions = {
  readonly encoding?: BufferEncoding;
  readonly filePath: string;
  readonly thresholds?: CoverageThresholds;
};

export type RunCoverageResult = {
  readonly coverage: { readonly covered: number; readonly total: number };
  readonly passed: boolean;
  readonly summary: CoverageSummary;
  readonly violations: readonly ThresholdViolation[];
};

export class RunCoverageError extends Error {
  public override readonly name = "RunCoverageError";
}

const runRead = (options: { encoding?: BufferEncoding; filePath: string }) => {
  return Effect.try({
    catch: (cause) => {
      return new RunCoverageError(
        `run-coverage: read ${options.filePath} failed: ${String(cause)}`
      );
    },
    try: () => {
      return readCoverageSummary({
        ...(!isNil(options.encoding) && { encoding: options.encoding }),
        filePath: options.filePath
      });
    }
  });
};

export const runCoverage = (options: RunCoverageOptions) => {
  return Effect.gen(function* () {
    const thresholds = isNil(options.thresholds)
      ? DEFAULT_THRESHOLDS
      : options.thresholds;
    const summary = yield* runRead({
      ...(!isNil(options.encoding) && { encoding: options.encoding }),
      filePath: options.filePath
    });
    const isPassed = isCoveragePassing(summary, thresholds);
    const violations = isPassed
      ? []
      : checkCoverageThresholds(summary, thresholds);
    return {
      coverage: summarizeCoverage(summary),
      passed: isPassed,
      summary,
      violations
    };
  });
};
