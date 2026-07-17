import type { AutofixFileEntry } from "../src/domain/eslint-autofix.ts";

export const RULE_NO_CONSOLE = "no-console";

export const buildPayload = (results: AutofixFileEntry[]) => {
  return JSON.stringify({ results });
};

export const message = (
  overrides: Partial<{
    column: number;
    fixable: boolean;
    line: number;
    message: string;
    ruleId: null | string;
    severity: number;
  }> = {}
) => {
  return {
    column: overrides.column ?? 1,
    fixable: overrides.fixable ?? true,
    line: overrides.line ?? 1,
    message: overrides.message ?? "msg",
    ruleId: overrides.ruleId ?? null,
    severity: overrides.severity ?? 2
  };
};
