import { describe, expect, it } from "vitest";

import { buildCheckReport } from "../src/domain/check-report.ts";
import {
  buildLintSlot,
  buildTestSlot,
  buildTscSlot,
  buildWorkspace,
  T0,
  T1,
  T10
} from "./check-report-helpers.ts";

describe("buildCheckReport tsc summary", () => {
  it("sums tsc errors and warnings", () => {
    const report = buildCheckReport(
      T0,
      T1,
      [
        buildWorkspace("a", {
          tsc: buildTscSlot({ errorCount: 1, warningCount: 3 })
        }),
        buildWorkspace("b", {
          tsc: buildTscSlot({ errorCount: 2, warningCount: 0 })
        })
      ],
      true
    );

    expect(report.summary.tsc.errorCount).toBe(3);
    expect(report.summary.tsc.warningCount).toBe(3);
  });

  it("counts a tsc workspace as failed when ran and not passed", () => {
    const report = buildCheckReport(
      T0,
      T1,
      [
        buildWorkspace("a", {
          tsc: buildTscSlot({ passed: false })
        })
      ],
      true
    );

    expect(report.summary.tsc.failed).toBe(1);
  });

  it("counts tsc.passed as 1 when ran and passed", () => {
    const report = buildCheckReport(
      T0,
      T1,
      [
        buildWorkspace("a", {
          tsc: buildTscSlot({ passed: true })
        })
      ],
      true
    );

    expect(report.summary.tsc.passed).toBe(1);
    expect(report.summary.tsc.ran).toBe(1);
  });
});

describe("buildCheckReport test summary", () => {
  it("sums failedTests.length across workspaces", () => {
    const report = buildCheckReport(
      T0,
      T1,
      [
        buildWorkspace("a", {
          test: buildTestSlot({
            failedTests: [{ name: "x" }, { name: "y" }],
            passed: false
          })
        }),
        buildWorkspace("b", {
          test: buildTestSlot({ failedTests: [{ name: "z" }], passed: false })
        })
      ],
      true
    );

    expect(report.summary.test.failedTestCount).toBe(3);
    expect(report.summary.test.failed).toBe(2);
  });

  it("counts test.passed as 1 when ran and passed", () => {
    const report = buildCheckReport(
      T0,
      T1,
      [
        buildWorkspace("a", {
          test: buildTestSlot({ passed: true })
        })
      ],
      true
    );

    expect(report.summary.test.passed).toBe(1);
    expect(report.summary.test.ran).toBe(1);
  });
});

describe("buildCheckReport structure", () => {
  it("passes through startedAt and finishedAt", () => {
    const report = buildCheckReport(T0, T10, [], true);

    expect(report.startedAt).toBe(T0);
    expect(report.finishedAt).toBe(T10);
  });

  it("counts workspaces in summary.workspaces", () => {
    const report = buildCheckReport(
      T0,
      T10,
      [
        buildWorkspace("a", { lint: buildLintSlot() }),
        buildWorkspace("b", { lint: buildLintSlot() }),
        buildWorkspace("c", { lint: buildLintSlot() })
      ],
      true
    );

    expect(report.summary.workspaces).toBe(3);
    expect(report.workspaces).toHaveLength(3);
  });

  it("returns 0 for all fields on an empty workspace list", () => {
    const report = buildCheckReport(T0, T10, [], false);

    expect(report.exitCode).toBe(0);
    expect(report.summary).toStrictEqual({
      lint: {
        autofix: {
          byRule: [],
          fixedErrorCount: 0,
          fixedWarningCount: 0,
          ran: false,
          ranInWorkspaces: 0
        },
        errorCount: 0,
        failed: 0,
        passed: 0,
        ran: 0,
        warningCount: 0
      },
      test: { failed: 0, failedTestCount: 0, passed: 0, ran: 0 },
      tsc: { errorCount: 0, failed: 0, passed: 0, ran: 0, warningCount: 0 },
      workspaces: 0
    });
  });
});
