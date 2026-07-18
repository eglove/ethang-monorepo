import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { readCoverageSummary } from "../src/infrastructure/fs-coverage.ts";

const TEMP_PREFIX = "monorepo-tools-fs-coverage-";
const COVERAGE_FILE = "coverage-summary.json";
const NOT_JSON = "{not valid json";

const sampleSummary = {
  total: {
    branches: { covered: 90, pct: 95, total: 100 },
    functions: { covered: 50, pct: 100, total: 50 },
    lines: { covered: 200, pct: 100, total: 200 },
    statements: { covered: 200, pct: 100, total: 200 }
  }
};

const makeTemporaryRoot = () => {
  return mkdtempSync(path.join(tmpdir(), TEMP_PREFIX));
};

const writeSummaryFile = (filePath: string, payload: unknown) => {
  writeFileSync(filePath, JSON.stringify(payload), "utf8");
};

const writeRaw = (filePath: string, content: string) => {
  writeFileSync(filePath, content, "utf8");
};

const withinTemporaryRoot = (body: (temporaryRoot: string) => void) => {
  const temporaryRoot = makeTemporaryRoot();
  try {
    body(temporaryRoot);
  } finally {
    rmSync(temporaryRoot, { force: true, recursive: true });
  }
};

describe(readCoverageSummary, () => {
  it("returns a parsed CoverageSummary for a well-formed file", () => {
    withinTemporaryRoot((temporaryRoot) => {
      const filePath = path.join(temporaryRoot, COVERAGE_FILE);
      writeSummaryFile(filePath, sampleSummary);

      expect(readCoverageSummary({ filePath })).toStrictEqual(
        sampleSummary.total
      );
    });
  });

  it("reads the file with the default utf8 encoding when none is given", () => {
    withinTemporaryRoot((temporaryRoot) => {
      const filePath = path.join(temporaryRoot, COVERAGE_FILE);
      writeSummaryFile(filePath, sampleSummary);

      expect(readCoverageSummary({ filePath }).lines.total).toBe(200);
    });
  });

  it("honours a caller-supplied encoding", () => {
    withinTemporaryRoot((temporaryRoot) => {
      const filePath = path.join(temporaryRoot, COVERAGE_FILE);
      writeRaw(filePath, JSON.stringify(sampleSummary));

      expect(
        readCoverageSummary({ encoding: "utf8", filePath }).functions.pct
      ).toBe(100);
    });
  });

  it("propagates ENOENT when the file does not exist", () => {
    withinTemporaryRoot((temporaryRoot) => {
      const missingPath = path.join(temporaryRoot, "missing.json");

      expect(() => {
        readCoverageSummary({ filePath: missingPath });
      }).toThrow(/ENOENT/u);
    });
  });

  it("wraps malformed JSON in a domain error", () => {
    withinTemporaryRoot((temporaryRoot) => {
      const filePath = path.join(temporaryRoot, COVERAGE_FILE);
      writeRaw(filePath, NOT_JSON);

      expect(() => {
        readCoverageSummary({ filePath });
      }).toThrow(/coverage-summary/u);
    });
  });
});
