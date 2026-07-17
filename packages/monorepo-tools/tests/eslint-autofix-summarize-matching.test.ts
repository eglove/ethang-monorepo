import { describe, expect, it } from "vitest";

import { summarizeAutofix } from "../src/domain/eslint-autofix.ts";
import { message, RULE_NO_CONSOLE } from "./eslint-autofix-helpers.ts";

describe("summarizeAutofix identical-rule matching", () => {
  it("uses line/column/message to discriminate identical-rule messages", () => {
    const summary = summarizeAutofix({
      results: [
        {
          filePath: "a.ts",
          postFixMessages: [],
          preFixMessages: [
            message({
              column: 1,
              line: 1,
              message: "first",
              ruleId: RULE_NO_CONSOLE,
              severity: 2
            }),
            message({
              column: 1,
              line: 2,
              message: "second",
              ruleId: RULE_NO_CONSOLE,
              severity: 2
            })
          ]
        }
      ]
    });

    expect(summary.fixedErrorCount).toBe(2);
    expect(summary.byFile[0]?.fixedByRule).toStrictEqual({
      [RULE_NO_CONSOLE]: 2
    });
    expect(summary.byRule[0]?.fixedErrorCount).toBe(2);
  });

  it("matches identical messages one-for-one instead of collapsing them", () => {
    const make = () => {
      return message({
        column: 1,
        line: 1,
        message: "dup",
        ruleId: RULE_NO_CONSOLE,
        severity: 2
      });
    };

    const summary = summarizeAutofix({
      results: [
        {
          filePath: "a.ts",
          postFixMessages: [make()],
          preFixMessages: [make(), make(), make()]
        }
      ]
    });

    // 3 pre, 1 still present post => 2 fixed by --fix.
    expect(summary.fixedErrorCount).toBe(2);
    expect(summary.byFile[0]?.fixedByRule).toStrictEqual({
      [RULE_NO_CONSOLE]: 2
    });
  });

  it("separates fixedErrors from fixedWarnings by severity", () => {
    const summary = summarizeAutofix({
      results: [
        {
          filePath: "a.ts",
          postFixMessages: [],
          preFixMessages: [
            message({ ruleId: "err-rule", severity: 2 }),
            message({ ruleId: "warn-rule", severity: 1 })
          ]
        }
      ]
    });

    expect(summary.fixedErrorCount).toBe(1);
    expect(summary.fixedWarningCount).toBe(1);
    expect(summary.byRule).toHaveLength(2);
    expect(summary.byRule).toStrictEqual(
      expect.arrayContaining([
        {
          fileCount: 1,
          fixedErrorCount: 1,
          fixedWarningCount: 0,
          ruleId: "err-rule"
        },
        {
          fileCount: 1,
          fixedErrorCount: 0,
          fixedWarningCount: 1,
          ruleId: "warn-rule"
        }
      ])
    );
  });
});
