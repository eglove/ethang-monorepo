import map from "lodash/map.js";
import { describe, expect, it } from "vitest";

import { summarizeAutofix } from "../src/domain/eslint-autofix.ts";
import { message, RULE_NO_CONSOLE } from "./eslint-autofix-helpers.ts";

describe("summarizeAutofix ordering and omission", () => {
  it("sorts byRule descending by total fixed", () => {
    const summary = summarizeAutofix({
      results: [
        {
          filePath: "a.ts",
          postFixMessages: [],
          preFixMessages: [
            message({ ruleId: "rule-a", severity: 2 }),
            message({ ruleId: "rule-a", severity: 2 })
          ]
        },
        {
          filePath: "b.ts",
          postFixMessages: [],
          preFixMessages: [message({ ruleId: "rule-b", severity: 2 })]
        }
      ]
    });

    expect(map(summary.byRule, "ruleId")).toStrictEqual(["rule-a", "rule-b"]);
  });

  it("breaks byRule ties alphabetically", () => {
    const summary = summarizeAutofix({
      results: [
        {
          filePath: "a.ts",
          postFixMessages: [],
          preFixMessages: [
            message({ ruleId: "rule-z", severity: 2 }),
            message({ ruleId: "rule-a", severity: 2 })
          ]
        }
      ]
    });

    expect(map(summary.byRule, "ruleId")).toStrictEqual(["rule-a", "rule-z"]);
  });

  it("omits byFile entries when a file produced no fixes and no unfixable-but-fixable", () => {
    const survived = message({
      fixable: false,
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

    expect(summary.byFile).toStrictEqual([]);
    expect(summary.byRule).toStrictEqual([]);
  });
});
