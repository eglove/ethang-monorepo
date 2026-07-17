import { describe, expect, it } from "vitest";

import { summarizeAutofix } from "../src/domain/eslint-autofix.ts";
import { message, RULE_NO_CONSOLE } from "./eslint-autofix-helpers.ts";

describe("summarizeAutofix basics", () => {
  it("returns a 0-shaped summary for an empty payload", () => {
    expect(summarizeAutofix({ results: [] })).toStrictEqual({
      byFile: [],
      byRule: [],
      fixedErrorCount: 0,
      fixedWarningCount: 0,
      unfixableButFixableCount: 0
    });
  });

  it("attributes a fixed error to a file and to its rule", () => {
    const summary = summarizeAutofix({
      results: [
        {
          filePath: "a.ts",
          postFixMessages: [],
          preFixMessages: [
            message({
              column: 1,
              line: 1,
              message: "no console",
              ruleId: RULE_NO_CONSOLE,
              severity: 2
            })
          ]
        }
      ]
    });

    expect(summary.fixedErrorCount).toBe(1);
    expect(summary.fixedWarningCount).toBe(0);
    expect(summary.unfixableButFixableCount).toBe(0);
    expect(summary.byFile).toStrictEqual([
      {
        file: "a.ts",
        fixedByRule: { [RULE_NO_CONSOLE]: 1 },
        fixedErrorCount: 1,
        fixedWarningCount: 0,
        unfixableButFixableCount: 0
      }
    ]);
    expect(summary.byRule).toStrictEqual([
      {
        fileCount: 1,
        fixedErrorCount: 1,
        fixedWarningCount: 0,
        ruleId: RULE_NO_CONSOLE
      }
    ]);
  });

  it("does not attribute messages that survived --fix", () => {
    const survived = message({
      fixable: false,
      message: "still there",
      ruleId: RULE_NO_CONSOLE,
      severity: 2
    });
    const summary = summarizeAutofix({
      results: [
        {
          filePath: "a.ts",
          postFixMessages: [survived],
          preFixMessages: [survived]
        }
      ]
    });

    expect(summary.fixedErrorCount).toBe(0);
    expect(summary.byFile).toStrictEqual([]);
    expect(summary.byRule).toStrictEqual([]);
    expect(summary.unfixableButFixableCount).toBe(0);
  });

  it("counts a fixable-but-still-present message as unfixableButFixable", () => {
    const survived = message({
      fixable: true,
      message: "left behind",
      ruleId: RULE_NO_CONSOLE,
      severity: 2
    });
    const summary = summarizeAutofix({
      results: [
        {
          filePath: "a.ts",
          postFixMessages: [survived],
          preFixMessages: [survived]
        }
      ]
    });

    expect(summary.fixedErrorCount).toBe(0);
    expect(summary.unfixableButFixableCount).toBe(1);
    expect(summary.byFile).toStrictEqual([
      {
        file: "a.ts",
        fixedByRule: {},
        fixedErrorCount: 0,
        fixedWarningCount: 0,
        unfixableButFixableCount: 1
      }
    ]);
  });

  it("does not flag non-fixable surviving messages", () => {
    const survived = message({
      fixable: false,
      message: "manual",
      ruleId: RULE_NO_CONSOLE,
      severity: 2
    });
    const summary = summarizeAutofix({
      results: [
        {
          filePath: "a.ts",
          postFixMessages: [survived],
          preFixMessages: [survived]
        }
      ]
    });

    expect(summary.unfixableButFixableCount).toBe(0);
    expect(summary.byFile).toStrictEqual([]);
    expect(summary.byRule).toStrictEqual([]);
  });
});
