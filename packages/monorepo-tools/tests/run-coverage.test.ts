import { Effect } from "effect";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  runCoverage,
  RunCoverageError,
  type RunCoverageOptions,
  type RunCoverageResult
} from "../src/application/run-coverage.ts";
import { DEFAULT_THRESHOLDS } from "../src/domain/coverage-thresholds.ts";

const PASSING_SUMMARY = (overrides: {
  branches?: number;
  functions?: number;
  lines?: number;
  statements?: number;
}) => {
  return JSON.stringify({
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
  });
};

const writeSummary = (raw: string) => {
  const directory = path.join(os.tmpdir(), `mt-coverage-${randomUUID()}`);
  mkdirSync(directory, { recursive: true });
  const filePath = path.join(directory, "coverage-summary.json");
  writeFileSync(filePath, raw);
  return filePath;
};

const runOk = async (options: RunCoverageOptions) => {
  return Effect.runPromise(runCoverage(options));
};

const extractFailureCause = async (options: RunCoverageOptions) => {
  const exit = await Effect.runPromiseExit(runCoverage(options));

  expect(exit._tag).toBe("Failure");

  if ("Failure" === exit._tag) {
    const { cause } = exit;

    expect(cause).toBeDefined();

    const { error } = cause as { error?: unknown };

    return error ?? null;
  }
  return null;
};

describe(runCoverage, () => {
  it("returns passed=true and empty violations when default thresholds are met", async () => {
    const filePath = writeSummary(PASSING_SUMMARY({}));

    const result = await runOk({ filePath });

    expect(result.passed).toBe(true);
    expect(result.violations).toStrictEqual([]);
    expect(result.summary).toStrictEqual({
      branches: { covered: 0, pct: 100, total: 1 },
      functions: { covered: 0, pct: 100, total: 1 },
      lines: { covered: 0, pct: 100, total: 1 },
      statements: { covered: 0, pct: 100, total: 1 }
    });
  });

  it("returns passed=false with all four violations when nothing is covered", async () => {
    const filePath = writeSummary(
      PASSING_SUMMARY({ branches: 0, functions: 0, lines: 0, statements: 0 })
    );

    const result = await runOk({ filePath });

    expect(result.passed).toBe(false);
    expect(result.violations).toStrictEqual(
      expect.arrayContaining([
        { actual: 0, metric: "branches", required: 100 },
        { actual: 0, metric: "functions", required: 100 },
        { actual: 0, metric: "lines", required: 100 },
        { actual: 0, metric: "statements", required: 100 }
      ])
    );
    expect(result.violations).toHaveLength(4);
    expect(result.coverage).toStrictEqual({ covered: 0, total: 4 });
  });

  it("respects custom thresholds and reports per-metric actual/required", async () => {
    const filePath = writeSummary(PASSING_SUMMARY({ branches: 75, lines: 80 }));

    const result = await runOk({
      filePath,
      thresholds: { branches: 80, functions: 100, lines: 90, statements: 100 }
    });

    expect(result.passed).toBe(false);
    expect(result.violations).toStrictEqual(
      expect.arrayContaining([
        { actual: 75, metric: "branches", required: 80 },
        { actual: 80, metric: "lines", required: 90 }
      ])
    );
    expect(result.violations).toHaveLength(2);
    expect(result.coverage).toStrictEqual({ covered: 0, total: 4 });
  });

  it("treats equality as passing under custom thresholds", async () => {
    const filePath = writeSummary(PASSING_SUMMARY({ lines: 85 }));

    const result = await runOk({
      filePath,
      thresholds: { branches: 100, functions: 100, lines: 85, statements: 100 }
    });

    expect(result.passed).toBe(true);
    expect(result.violations).toStrictEqual([]);
  });

  it("summarizes covered/total across all four metrics", async () => {
    const filePath = writeSummary(
      JSON.stringify({
        branches: { covered: 8, pct: 80, total: 10 },
        functions: { covered: 5, pct: 100, total: 5 },
        lines: { covered: 90, pct: 90, total: 100 },
        statements: { covered: 180, pct: 90, total: 200 }
      })
    );

    const result: RunCoverageResult = await runOk({ filePath });

    expect(result.coverage).toStrictEqual({ covered: 283, total: 315 });
  });

  it("returns RunCoverageError when the file does not exist", async () => {
    const filePath = path.join(
      os.tmpdir(),
      `mt-coverage-missing-${randomUUID()}`,
      "summary.json"
    );

    const cause = await extractFailureCause({ filePath });

    expect(cause).toBeInstanceOf(RunCoverageError);
  });

  it("returns RunCoverageError when the JSON is malformed", async () => {
    const filePath = writeSummary("{ not json");

    const cause = await extractFailureCause({ filePath });

    expect(cause).toBeInstanceOf(RunCoverageError);
  });

  it("returns RunCoverageError when a metric is missing from the payload", async () => {
    const filePath = writeSummary(
      JSON.stringify({ branches: { covered: 1, pct: 100, total: 1 } })
    );

    const cause = await extractFailureCause({ filePath });

    expect(cause).toBeInstanceOf(RunCoverageError);
  });

  it("uses DEFAULT_THRESHOLDS when none provided", async () => {
    const filePath = writeSummary(PASSING_SUMMARY({}));

    const result = await runOk({ filePath });

    expect(result.passed).toBe(true);
    expect(DEFAULT_THRESHOLDS).toStrictEqual({
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    });
  });

  it("propagates encoding option through to the IO layer", async () => {
    const filePath = writeSummary(PASSING_SUMMARY({}));

    const result = await runOk({ encoding: "utf8", filePath });

    expect(result.passed).toBe(true);
  });
});
