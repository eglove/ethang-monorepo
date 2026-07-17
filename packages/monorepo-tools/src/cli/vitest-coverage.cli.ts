#!/usr/bin/env bun

/**
Run vitest coverage for a single workspace and output the
coverage-summary check result as JSON.

Usage:
  bun src/cli/vitest-coverage.cli.ts --cwd <dir> [--thresholds <json>] [--coverage-file <path>]

Output (stdout JSON):
  { "passed": bool, "coverage": { "covered": number, "total": number }, "violations": [...] }

Exit codes:
  0 = coverage meets thresholds
  1 = below thresholds or config error
*/

import { Effect, Schema } from "effect";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import process from "node:process";

import {
  runCoverage,
  type RunCoverageOptions
} from "../application/run-coverage.ts";

const EXIT_FAIL = 1;

const fail = (message: string) => {
  process.stderr.write(`vitest-coverage: ${message}\n`);
  return process.exit(EXIT_FAIL);
};

const ThresholdsSchema = Schema.Struct({
  branches: Schema.Number,
  functions: Schema.Number,
  lines: Schema.Number,
  statements: Schema.Number
});

const shiftNext = (tail: readonly string[]) => {
  const [next, ...rest] = tail;
  const value = next ?? fail("Missing value after flag");
  return { rest, value };
};

const shiftArguments = (
  remaining: readonly string[],
  accumulator: {
    coverageFile: null | string;
    cwd: null | string;
    thresholds: null | string;
  }
) => {
  const [head, ...tail] = remaining;
  if (isNil(head) || isEmpty(head)) {
    return accumulator;
  }
  if ("--help" === head || "-h" === head) {
    process.stdout.write(
      "Usage: bun vitest-coverage.cli.ts --cwd <dir> [--thresholds <json>] [--coverage-file <path>]\n"
    );
    process.exit(0);
  }
  switch (head) {
    case "--coverage-file": {
      const { rest, value } = shiftNext(tail);
      return shiftArguments(rest, { ...accumulator, coverageFile: value });
    }
    case "--cwd": {
      const { rest, value } = shiftNext(tail);
      return shiftArguments(rest, { ...accumulator, cwd: value });
    }
    case "--thresholds": {
      const { rest, value } = shiftNext(tail);
      return shiftArguments(rest, { ...accumulator, thresholds: value });
    }
    // No default
  }
  fail(`Unknown argument: ${head}`);
  return accumulator;
};

export const parseArguments = (argv: readonly string[]) => {
  const {
    coverageFile,
    cwd,
    thresholds: rawThresholds
  } = shiftArguments(argv, {
    coverageFile: null,
    cwd: null,
    thresholds: null
  });
  const requiredCwd = cwd ?? fail("Missing --cwd <directory>");
  const thresholds = isNil(rawThresholds)
    ? null
    : Schema.decodeUnknownSync(Schema.parseJson(ThresholdsSchema))(
        rawThresholds
      );
  return {
    coverageFile: coverageFile ?? "coverage/coverage-summary.json",
    cwd: requiredCwd,
    thresholds: thresholds ?? null
  };
};

export const main = async (argv: readonly string[]) => {
  const { coverageFile, cwd, thresholds } = parseArguments(argv);
  process.chdir(cwd);
  const options: RunCoverageOptions = {
    ...(!isNil(thresholds) && { thresholds }),
    filePath: coverageFile
  };

  const result = await Effect.runPromise(runCoverage(options));
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (!result.passed) {
    process.exit(1);
  }
};

/* v8 ignore next 3 -- import.meta.main is true only when Bun launches this CLI. */
if (import.meta.main) {
  await main(process.argv.slice(2));
}
