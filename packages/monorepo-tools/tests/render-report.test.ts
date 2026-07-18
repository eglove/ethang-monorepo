import { Effect } from "effect";
import filter from "lodash/filter.js";
import isNil from "lodash/isNil.js";
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
const COVERAGE_HEADER_FULL =
  "coverage - 100% lines / 100% branches / 100% functions / 100% statements";
const COVERAGE_PREFIX = "coverage -";

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
    ["message", "mes..."],
    ["hi", "hi"],
    ["", ""]
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

describe("render report coverage", () => {
  it("lists a passing workspace without a coverage block", () => {
    const report: ReportJson = {
      summary: { coverage: { failed: 0, passed: 1, ran: 1 } },
      workspaces: [
        {
          coverage: {
            passed: true,
            ran: true,
            summary: {
              branches: { pct: 100 },
              functions: { pct: 100 },
              lines: { pct: 100 },
              statements: { pct: 100 }
            },
            violations: []
          },
          name: "covered",
          path: "packages/covered"
        }
      ]
    };

    const text = textBlocks(report).join("\n");

    expect(text).not.toContain(COVERAGE_PREFIX);
    expect(text).toContain("Passed (1)");
  });

  it("renders violations when coverage is below threshold", () => {
    const report: ReportJson = {
      summary: { coverage: { failed: 1, passed: 0, ran: 1 } },
      workspaces: [
        {
          coverage: {
            passed: false,
            ran: true,
            summary: {
              branches: { pct: 94.97 },
              functions: { pct: 96.78 },
              lines: { pct: 95.33 },
              statements: { pct: 95.34 }
            },
            violations: [
              { actual: 94.97, metric: "branches", required: 100 },
              { actual: 95.33, metric: "lines", required: 100 }
            ]
          },
          name: "uncovered",
          path: "packages/uncovered"
        }
      ]
    };

    const text = textBlocks(report).join("\n");

    expect(text).toContain(
      "coverage - 95% lines / 95% branches / 97% functions / 95% statements"
    );
    expect(text).toContain("1. branches 95% < required 100%");
    expect(text).toContain("2. lines 95% < required 100%");
    expect(text).not.toContain("Passed (");
  });

  it("lists a workspace without a coverage summary without a coverage block", () => {
    const report: ReportJson = {
      workspaces: [
        {
          coverage: { passed: true, ran: true, summary: null, violations: [] },
          name: "no-summary",
          path: "packages/no-summary"
        }
      ]
    };

    expect(textBlocks(report).join("\n")).not.toContain(COVERAGE_PREFIX);
  });

  it("renders a failed coverage block when the summary is missing", () => {
    const report: ReportJson = {
      workspaces: [
        {
          coverage: { passed: false, ran: true, summary: null, violations: [] },
          name: "no-summary-failed",
          path: "packages/no-summary-failed"
        }
      ]
    };

    const text = textBlocks(report).join("\n");

    expect(text).toContain(COVERAGE_HEADER_FULL);
    expect(text).not.toContain("Passed (");
  });

  it("renders 100% when coverage summary metrics are missing pct", () => {
    const report: ReportJson = {
      workspaces: [
        {
          coverage: {
            passed: false,
            ran: true,
            summary: {
              branches: {},
              functions: {},
              lines: {},
              statements: {}
            },
            violations: []
          },
          name: "partial-summary",
          path: "packages/partial-summary"
        }
      ]
    };

    const text = textBlocks(report).join("\n");

    expect(text).toContain(COVERAGE_HEADER_FULL);
    expect(text).not.toContain("Passed (");
  });

  it("renders a coverage block when violations is not an array", () => {
    const report: ReportJson = {
      workspaces: [
        {
          coverage: {
            passed: false,
            ran: true,
            summary: {
              branches: { pct: 100 },
              functions: { pct: 100 },
              lines: { pct: 100 },
              statements: { pct: 100 }
            }
          },
          name: "null-violations",
          path: "packages/null-violations"
        }
      ]
    };

    const text = textBlocks(report).join("\n");

    expect(text).toContain("(meets 100% thresholds)");
    expect(text).not.toContain("Passed (");
  });

  it("omits the coverage subsection when coverage did not run", () => {
    const report: ReportJson = {
      workspaces: [
        {
          coverage: { passed: true, ran: false },
          name: "skipped",
          path: "packages/skipped"
        }
      ]
    };

    const text = textBlocks(report).join("\n");

    expect(text).not.toContain(COVERAGE_PREFIX);
    expect(text).toContain("Passed (1)");
  });

  it("includes coverage in the summary table", () => {
    const report: ReportJson = {
      summary: { coverage: { failed: 1, passed: 0, ran: 2 } },
      workspaces: []
    };

    const tables = filter(buildReportBlocks(report), {
      type: "table"
    }) as { rows: readonly (readonly string[])[] }[];
    const coverageRow = tables[0]?.rows.find((row) => {
      return "coverage" === row[0];
    });

    expect(coverageRow).toStrictEqual(["coverage", "2", "0", "1", "-", "-"]);
  });

  it("renders a met-thresholds note for a failed workspace with no violations", () => {
    const report: ReportJson = {
      workspaces: [
        {
          coverage: {
            passed: false,
            ran: true,
            summary: {
              branches: { pct: 100 },
              functions: { pct: 100 },
              lines: { pct: 100 },
              statements: { pct: 100 }
            },
            violations: []
          },
          name: "flagged",
          path: "packages/flagged"
        }
      ]
    };

    const text = textBlocks(report).join("\n");

    expect(text).toContain(COVERAGE_HEADER_FULL);
    expect(text).toContain("(meets 100% thresholds)");
  });
});

describe("render report coverage summary defaults", () => {
  it("defaults metrics to 100% for a failed workspace with a null summary", () => {
    const report: ReportJson = {
      workspaces: [
        {
          coverage: {
            passed: false,
            ran: true,
            summary: null,
            violations: [{ actual: 90, metric: "lines", required: 100 }]
          },
          name: "no-summary-failed",
          path: "packages/no-summary-failed"
        }
      ]
    };

    const text = textBlocks(report).join("\n");

    expect(text).toContain(COVERAGE_HEADER_FULL);
    expect(text).toContain("1. lines 90% < required 100%");
  });
});

describe("render report branch coverage", () => {
  it("covers both arms of the test totals and failing-test defaults", () => {
    const reports: ReportJson[] = [
      {
        workspaces: [
          {
            name: "passed-no-totals",
            path: "p/1",
            test: { passed: true, ran: true }
          }
        ]
      },
      {
        workspaces: [
          {
            name: "failed-exit-zero",
            path: "p/2",
            test: {
              exitCode: 0,
              passed: false,
              ran: true
            }
          }
        ]
      },
      {
        workspaces: [
          {
            name: "failed-no-name-message",
            path: "p/3",
            test: {
              failingTests: [{}],
              passed: false,
              ran: true
            }
          }
        ]
      },
      {
        workspaces: [
          {
            name: "failed-partial-defaults",
            path: "p/4",
            test: {
              failingTests: [{ name: "only-name" }],
              passed: false,
              ran: true
            }
          }
        ]
      }
    ];

    const getReport = (index: number) => {
      const found = reports[index];

      if (isNil(found)) {
        throw new Error(`expected report at index ${index}`);
      }

      return found;
    };

    for (const report of reports) {
      expect(() => {
        buildReportBlocks(report);
      }).not.toThrow();
    }

    const zeroExit = textBlocks(getReport(1)).join("\n");

    expect(zeroExit).toContain("(no failing-test detail available)");

    const partial = textBlocks(getReport(3)).join("\n");

    expect(partial).toContain("1. **only-name** - ");
  });

  it("covers both arms of the coverage violation field defaults", () => {
    const report: ReportJson = {
      workspaces: [
        {
          coverage: {
            passed: false,
            ran: true,
            summary: {
              branches: { pct: 90 },
              functions: { pct: 91 },
              lines: { pct: 92 },
              statements: { pct: 93 }
            },
            violations: [{}, { metric: "lines" }, { actual: 80 }]
          },
          name: "sparse-violations",
          path: "packages/sparse"
        }
      ]
    };

    const text = textBlocks(report).join("\n");

    expect(text).toContain("coverage - 92% lines / 90% branches");
    expect(text).toContain("1. unknown 0% < required 100%");
    expect(text).toContain("2. lines 0% < required 100%");
    expect(text).toContain("3. unknown 80% < required 100%");
  });

  it("covers the autofix with-rules and lint-without-autofix arms", () => {
    const reports: ReportJson[] = [
      {
        summary: {
          lint: {
            autofix: {
              byRule: [{ fixedErrorCount: 1, ruleId: "rule" }],
              fixedErrorCount: 1,
              fixedWarningCount: 1,
              ran: true
            }
          }
        },
        workspaces: [
          {
            lint: {
              autofix: { fixedErrorCount: 2, fixedWarningCount: 0 },
              passed: false,
              ran: true
            },
            name: "ws-autofix",
            path: "p/ws"
          }
        ]
      },
      {
        summary: { lint: { autofix: { ran: true } } },
        workspaces: [
          {
            lint: { passed: false, ran: true, warningCount: 0 },
            name: "ws-no-autofix",
            path: "p/ws2"
          }
        ]
      }
    ];

    for (const report of reports) {
      expect(buildReportBlocks(report)).toBeDefined();
    }
  });

  it("covers header PASS/FAIL and empty workspace list", () => {
    expect(textBlocks({ summary: {} })).toContain(
      "Exit code: 0 - PASS  (0.0s, 0 workspaces checked)"
    );
    expect(
      textBlocks({ exitCode: 1, summary: { workspaces: 3 } }).join("\n")
    ).toContain("Exit code: 1 - FAIL");
  });
});
