import { describe, expect, it } from "vitest";

import { summarizeAutofix } from "../src/domain/eslint-autofix.ts";
import { message, RULE_NO_CONSOLE } from "./eslint-autofix-helpers.ts";

describe("summarizeAutofix rule aggregation", () => {
  it("counts a file once across multiple messages of the same rule", () => {
    const summary = summarizeAutofix({
      results: [
        {
          filePath: "a.ts",
          postFixMessages: [],
          preFixMessages: [
            message({
              column: 1,
              line: 1,
              message: "x",
              ruleId: RULE_NO_CONSOLE,
              severity: 2
            }),
            message({
              column: 1,
              line: 2,
              message: "y",
              ruleId: RULE_NO_CONSOLE,
              severity: 2
            })
          ]
        }
      ]
    });

    expect(summary.byRule).toStrictEqual([
      {
        fileCount: 1,
        fixedErrorCount: 2,
        fixedWarningCount: 0,
        ruleId: RULE_NO_CONSOLE
      }
    ]);
  });

  it("counts the same rule across two files as fileCount: 2", () => {
    const summary = summarizeAutofix({
      results: [
        {
          filePath: "a.ts",
          postFixMessages: [],
          preFixMessages: [message({ ruleId: RULE_NO_CONSOLE, severity: 2 })]
        },
        {
          filePath: "b.ts",
          postFixMessages: [],
          preFixMessages: [message({ ruleId: RULE_NO_CONSOLE, severity: 2 })]
        }
      ]
    });

    expect(summary.byRule).toStrictEqual([
      {
        fileCount: 2,
        fixedErrorCount: 2,
        fixedWarningCount: 0,
        ruleId: RULE_NO_CONSOLE
      }
    ]);
  });

  it("treats null ruleId as <unknown>", () => {
    const summary = summarizeAutofix({
      results: [
        {
          filePath: "a.ts",
          postFixMessages: [],
          preFixMessages: [
            message({
              column: 1,
              line: 1,
              message: "x",
              ruleId: null,
              severity: 2
            })
          ]
        }
      ]
    });

    expect(summary.byRule[0]?.ruleId).toBe("<unknown>");
  });

  it("survives --fix entries where two rules share the same (line, column, message)", () => {
    // Both pre and post are present, fixable=true on both. The matcher
    // must still pair them by full key (ruleId|line|column|message).
    const summary = summarizeAutofix({
      results: [
        {
          filePath: "a.ts",
          postFixMessages: [
            message({
              column: 1,
              fixable: true,
              line: 1,
              message: "shared",
              ruleId: "rule-a",
              severity: 2
            })
          ],
          preFixMessages: [
            message({
              column: 1,
              fixable: true,
              line: 1,
              message: "shared",
              ruleId: "rule-a",
              severity: 2
            }),
            message({
              column: 1,
              fixable: true,
              line: 1,
              message: "shared",
              ruleId: "rule-b",
              severity: 2
            })
          ]
        }
      ]
    });

    // rule-a is in both pre and post => unfixableButFixable. rule-b is
    // only pre => fixed.
    expect(summary.fixedErrorCount).toBe(1);
    expect(summary.unfixableButFixableCount).toBe(1);
    expect(
      summary.byRule.find((r) => {
        return "rule-b" === r.ruleId;
      })?.fixedErrorCount
    ).toBe(1);
    expect(
      summary.byRule.find((r) => {
        return "rule-a" === r.ruleId;
      })
    ).toBeUndefined();
  });
});
