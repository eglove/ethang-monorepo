import map from "lodash/map.js";
import { describe, expect, it } from "vitest";

import { buildCheckReport } from "../src/domain/check-report.ts";
import { summarizeAutofix } from "../src/domain/eslint-autofix.ts";
import {
  buildErrorMessage,
  buildLintSlot,
  buildWorkspace,
  T0,
  T1
} from "./check-report-helpers.ts";

describe("buildCheckReport exit code", () => {
  it("returns 0 when every ran check passed", () => {
    const report = buildCheckReport(
      T0,
      T1,
      [
        buildWorkspace("a", {
          lint: buildLintSlot({ errorCount: 2, passed: true })
        })
      ],
      true
    );

    expect(report.exitCode).toBe(0);
  });

  it("returns 1 when any ran check failed", () => {
    const report = buildCheckReport(
      T0,
      T1,
      [
        buildWorkspace("a", {
          lint: buildLintSlot({ errorCount: 2, passed: false })
        })
      ],
      true
    );

    expect(report.exitCode).toBe(1);
  });

  it("does not flag ran=false as a failure", () => {
    const report = buildCheckReport(
      T0,
      T1,
      [
        buildWorkspace("a", {
          lint: { ...buildLintSlot({ passed: false }), ran: false }
        })
      ],
      true
    );

    expect(report.exitCode).toBe(0);
    expect(report.summary.lint.failed).toBe(0);
  });
});

describe("buildCheckReport lint sums", () => {
  it("sums errorCount and warningCount across workspaces", () => {
    const report = buildCheckReport(
      T0,
      T1,
      [
        buildWorkspace("a", {
          lint: buildLintSlot({ errorCount: 3, warningCount: 2 })
        }),
        buildWorkspace("b", {
          lint: buildLintSlot({ errorCount: 1, warningCount: 4 })
        })
      ],
      true
    );

    expect(report.summary.lint.errorCount).toBe(4);
    expect(report.summary.lint.warningCount).toBe(6);
  });

  it("marks autofix.ran from the input flag", () => {
    const onReport = buildCheckReport(
      T0,
      T1,
      [buildWorkspace("a", { lint: buildLintSlot() })],
      true
    );

    expect(onReport.summary.lint.autofix.ran).toBe(true);

    const offReport = buildCheckReport(
      T0,
      T1,
      [buildWorkspace("a", { lint: buildLintSlot() })],
      false
    );

    expect(offReport.summary.lint.autofix.ran).toBe(false);
  });
});

describe("buildCheckReport lint ran/passed/failed counts", () => {
  it("counts a workspace as failed when lint ran and passed=false", () => {
    const report = buildCheckReport(
      T0,
      T1,
      [
        buildWorkspace("a", {
          lint: buildLintSlot({ errorCount: 5, passed: false })
        })
      ],
      true
    );

    expect(report.summary.lint.failed).toBe(1);
  });

  it("counts a workspace as passed when lint.passed is true", () => {
    const report = buildCheckReport(
      T0,
      T1,
      [
        buildWorkspace("a", {
          lint: buildLintSlot({ passed: true })
        }),
        buildWorkspace("b", {
          lint: { ...buildLintSlot({ passed: false }), ran: true }
        }),
        buildWorkspace("c", {
          lint: { ...buildLintSlot({ passed: true }), ran: false }
        })
      ],
      true
    );

    expect(report.summary.lint.passed).toBe(2);
    expect(report.summary.lint.ran).toBe(2);
    expect(report.summary.lint.failed).toBe(1);
  });
});

describe("buildCheckReport autofix aggregation", () => {
  it("aggregates byRule across workspaces sorted descending by total", () => {
    const autofixA = summarizeAutofix({
      results: [
        {
          filePath: "a.ts",
          postFixMessages: [],
          preFixMessages: [buildErrorMessage({ ruleId: "rule-a" })]
        }
      ]
    });
    const autofixB = summarizeAutofix({
      results: [
        {
          filePath: "b.ts",
          postFixMessages: [],
          preFixMessages: [
            buildErrorMessage({ column: 1, ruleId: "rule-b" }),
            buildErrorMessage({ column: 2, ruleId: "rule-b" })
          ]
        }
      ]
    });
    const report = buildCheckReport(
      T0,
      T1,
      [
        buildWorkspace("a", {
          lint: { ...buildLintSlot(), autofix: autofixA }
        }),
        buildWorkspace("b", {
          lint: { ...buildLintSlot(), autofix: autofixB }
        })
      ],
      true
    );

    expect(report.summary.lint.autofix.byRule).toStrictEqual([
      {
        fixedErrorCount: 2,
        fixedWarningCount: 0,
        ruleId: "rule-b",
        workspaceCount: 1
      },
      {
        fixedErrorCount: 1,
        fixedWarningCount: 0,
        ruleId: "rule-a",
        workspaceCount: 1
      }
    ]);
    expect(report.summary.lint.autofix.fixedErrorCount).toBe(3);
    expect(report.summary.lint.autofix.ranInWorkspaces).toBe(2);
  });

  it("counts a rule appearing in two workspaces as workspaceCount: 2", () => {
    const autofixA = summarizeAutofix({
      results: [
        {
          filePath: "a.ts",
          postFixMessages: [],
          preFixMessages: [buildErrorMessage({ ruleId: "rule-a" })]
        }
      ]
    });
    const report = buildCheckReport(
      T0,
      T1,
      [
        buildWorkspace("a", {
          lint: { ...buildLintSlot(), autofix: autofixA }
        }),
        buildWorkspace("b", {
          lint: { ...buildLintSlot(), autofix: autofixA }
        })
      ],
      true
    );

    expect(report.summary.lint.autofix.byRule).toStrictEqual([
      {
        fixedErrorCount: 2,
        fixedWarningCount: 0,
        ruleId: "rule-a",
        workspaceCount: 2
      }
    ]);
  });

  it("breaks byRule ties alphabetically when totals match", () => {
    const autofixZ = summarizeAutofix({
      results: [
        {
          filePath: "a.ts",
          postFixMessages: [],
          preFixMessages: [buildErrorMessage({ ruleId: "rule-z" })]
        }
      ]
    });
    const autofixA = summarizeAutofix({
      results: [
        {
          filePath: "b.ts",
          postFixMessages: [],
          preFixMessages: [buildErrorMessage({ ruleId: "rule-a" })]
        }
      ]
    });
    const report = buildCheckReport(
      T0,
      T1,
      [
        buildWorkspace("z", {
          lint: { ...buildLintSlot(), autofix: autofixZ }
        }),
        buildWorkspace("a", {
          lint: { ...buildLintSlot(), autofix: autofixA }
        })
      ],
      true
    );

    expect(map(report.summary.lint.autofix.byRule, "ruleId")).toStrictEqual([
      "rule-a",
      "rule-z"
    ]);
  });

  it("counts ranInWorkspaces = 0 when no workspace has autofix data", () => {
    const report = buildCheckReport(
      T0,
      T1,
      [buildWorkspace("a", { lint: buildLintSlot() })],
      true
    );

    expect(report.summary.lint.autofix.ranInWorkspaces).toBe(0);
    expect(report.summary.lint.autofix.byRule).toStrictEqual([]);
  });
});
