import { Effect } from "effect";
import filter from "lodash/filter.js";
import map from "lodash/map.js";
import repeat from "lodash/repeat.js";
import { describe, expect, it } from "vitest";

import {
  buildReportBlocks,
  renderReport,
  type ReportJson,
  trimMessage
} from "../src/application/render-report.ts";

const MESSAGE_MAX = 240;

const render = (report: ReportJson) => {
  return Effect.runSync(renderReport({ reportText: JSON.stringify(report) }));
};

const textBlocks = (report: ReportJson) => {
  return map(
    filter(buildReportBlocks(report), (block) => {
      return "text" in block;
    }),
    "text"
  );
};

describe("render report validation", () => {
  it.each([
    [null, ""],
    ["message", "mes..."]
  ])("trims nullable messages (%j)", (message, expected) => {
    expect(trimMessage(message, 6)).toBe(expected);
  });

  it("rejects JSON values that are not report objects", () => {
    const reportText = "[]";

    expect(() => {
      Effect.runSync(renderReport({ reportText }));
    }).toThrow("Predicate refinement failure");
  });

  it("rejects malformed JSON", () => {
    const reportText = "not json";

    expect(() => {
      Effect.runSync(renderReport({ reportText }));
    }).toThrow("Unexpected token");
  });
});

describe("render report output", () => {
  it("renders a complete failing report with all detailed diagnostics", () => {
    const longMessage = repeat("x", MESSAGE_MAX + 10);
    const report: ReportJson = {
      durationMs: 1234,
      exitCode: 1,
      summary: {
        lint: {
          autofix: {
            byRule: [{ fixedErrorCount: 1, fixedWarningCount: 2, ruleId: "a" }],
            fixedErrorCount: 1,
            fixedWarningCount: 2,
            ran: true,
            ranInWorkspaces: 2
          },
          errorCount: 1,
          failed: 1,
          passed: 1,
          ran: 2,
          warningCount: 2
        },
        test: { failed: 1, passed: 1, ran: 2 },
        tsc: {
          errorCount: 1,
          failed: 1,
          passed: 1,
          ran: 2,
          warningCount: 1
        },
        workspaces: 2
      },
      workspaces: [
        {
          error: "worker unavailable",
          lint: {
            autofix: {
              byRule: [],
              fixedErrorCount: 1,
              fixedWarningCount: 0
            },
            errorCount: 1,
            issues: [
              {
                column: 2,
                file: "a.ts",
                line: 1,
                message: longMessage,
                ruleId: "rule-error",
                severity: 2
              },
              {
                column: 3,
                file: "b.ts",
                line: 2,
                message: "warning",
                ruleId: "rule-warning",
                severity: 1
              },
              {
                column: 4,
                file: "c.ts",
                line: 3,
                message: "fatal",
                severity: 0
              }
            ],
            passed: false,
            ran: true,
            warningCount: 1
          },
          name: "broken",
          path: "packages/broken",
          test: {
            failingTests: [{ message: longMessage, name: "first" }],
            parseError: "parse issue",
            passed: false,
            ran: true
          },
          tsc: {
            diagnostics: [
              {
                code: "TS1",
                column: 5,
                file: "a.ts",
                line: 4,
                message: longMessage
              }
            ],
            errorCount: 1,
            passed: false,
            ran: true,
            warningCount: 1
          }
        },
        {
          name: "passing",
          path: "packages/passing",
          test: { passed: true, ran: true, totals: { passed: 2, total: 2 } }
        }
      ]
    };

    const result = render(report);
    const text = textBlocks(report).join("\n");

    expect(result.blocks).toHaveLength(buildReportBlocks(report).length);
    expect(text).toMatch(
      /Exit code: 1 - FAIL {2}\(1\.2s, 2 workspaces checked\)[\s\S]*\*\*broken\*\*: 1 error \/ 0 warnings fixed; top rules: no rules[\s\S]*Autofix already ran; remaining issues need manual edits\.[\s\S]*vitest parse error: parse issue[\s\S]*Workspace error: worker unavailable/u
    );
    expect(text).toContain(`${repeat("x", MESSAGE_MAX - 3)}...`);
  });

  it("uses report workspace length and defaults for an incomplete passing report", () => {
    const report: ReportJson = {
      summary: { lint: { autofix: { ran: true } } },
      workspaces: [
        { name: "only" },
        {
          lint: {
            autofix: {
              byRule: [{}],
              fixedErrorCount: 1,
              fixedWarningCount: 1
            },
            passed: false
          },
          test: { passed: true, ran: true },
          tsc: { passed: true }
        }
      ]
    };

    const text = textBlocks(report).join("\n");

    expect(text).toMatch(
      /Exit code: 0 - PASS {2}\(0\.0s, 2 workspaces checked\)[\s\S]*\*\*\(unnamed\)\*\*: 1 error \/ 1 warning fixed; top rules: `\(unknown\)` \(0\)[\s\S]*test - passed \(0\/0\)[\s\S]*Passed \(1\)/u
    );
  });
});

describe("render report edge cases", () => {
  it("renders no-detail diagnostics and each missing failing-test fallback", () => {
    const report: ReportJson = {
      summary: { lint: { autofix: { ran: true } } },
      workspaces: [
        {
          lint: {
            errorCount: 0,
            issues: [],
            passed: false,
            ran: true,
            warningCount: 0
          },
          name: "empty-lint",
          tsc: { errorCount: 0, passed: false, ran: true, warningCount: 0 }
        },
        {
          lint: { errorCount: 1, passed: false, ran: true },
          name: "undetailed-lint",
          tsc: { errorCount: 1, passed: false, ran: true }
        },
        {
          name: "parse",
          test: { parseError: "bad input", passed: false, ran: true }
        },
        {
          name: "exit",
          test: { exitCode: 2, passed: false, ran: true }
        },
        {
          name: "unknown",
          test: { passed: false, ran: true }
        }
      ]
    };

    const text = textBlocks(report).join("\n");

    expect(text).toMatch(
      /\(no diagnostics\)[\s\S]*\(no detail; see autofix delta above\)[\s\S]*\(no detail\)[\s\S]*\(vitest parse error: bad input\)[\s\S]*\(vitest exited with code 2 but reported no test-level failures\.\)[\s\S]*\(no failing-test detail available\)/u
    );
  });

  it("omits the autofix section when it did not run", () => {
    expect(textBlocks({ summary: {} })).not.toContain("Autofix applied");
  });

  it("skips workspace autofix entries with no applied fixes", () => {
    const report: ReportJson = {
      summary: { lint: { autofix: { ran: true } } },
      workspaces: [
        { lint: { autofix: { fixedErrorCount: 0, fixedWarningCount: 0 } } }
      ]
    };

    expect(textBlocks(report)).not.toContain("Autofix applied");
  });

  it("renders sparse diagnostics and absent report sections", () => {
    const sparse: ReportJson = {
      summary: { lint: { autofix: { ran: true } } },
      workspaces: [
        {
          lint: {
            autofix: {},
            issues: [{}],
            passed: false,
            ran: true
          },
          test: { failingTests: [{}], passed: false, ran: true },
          tsc: { diagnostics: [{}], passed: false, ran: true }
        },
        {
          lint: {
            autofix: { fixedErrorCount: 1 },
            passed: false
          }
        },
        { tsc: { passed: true } }
      ]
    };

    expect(() => {
      buildReportBlocks({});
      buildReportBlocks(sparse);
    }).not.toThrow();
  });

  it("summarizes autofixes without workspace entries when rules were fixed", () => {
    const report: ReportJson = {
      summary: {
        lint: {
          autofix: {
            byRule: [{ ruleId: "rule" }],
            fixedErrorCount: 1,
            fixedWarningCount: 1,
            ran: true
          }
        }
      }
    };

    expect(textBlocks(report).join("\n")).toContain(
      "1 error / 1 warning fixed across the run."
    );
  });
});
