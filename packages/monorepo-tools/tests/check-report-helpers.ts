import type { WorkspaceReport } from "../src/domain/check-report.ts";

export const T0 = "2024-01-01T00:00:00.000Z";
export const T1 = "2024-01-01T00:00:01.000Z";
export const T10 = "2024-01-01T00:00:10.000Z";

export const RULE_A = "rule-a";
export const RULE_B = "rule-b";
export const RULE_Z = "rule-z";

export const buildLintSlot = (overrides?: {
  errorCount?: number;
  passed?: boolean;
  ran?: boolean;
  warningCount?: number;
}) => {
  return {
    autofix: null,
    errorCount: overrides?.errorCount ?? 0,
    passed: overrides?.passed ?? true,
    ran: overrides?.ran ?? true,
    warningCount: overrides?.warningCount ?? 0
  };
};

export const buildTscSlot = (overrides?: {
  errorCount?: number;
  passed?: boolean;
  ran?: boolean;
  warningCount?: number;
}) => {
  return {
    errorCount: overrides?.errorCount ?? 0,
    passed: overrides?.passed ?? true,
    ran: overrides?.ran ?? true,
    warningCount: overrides?.warningCount ?? 0
  };
};

export const buildTestSlot = (overrides?: {
  failedTests?: readonly { name: string }[];
  passed?: boolean;
  ran?: boolean;
}) => {
  return {
    failedTests: overrides?.failedTests ?? [],
    passed: overrides?.passed ?? true,
    ran: overrides?.ran ?? true
  };
};

export const buildWorkspace = (
  name: string,
  overrides: {
    lint?: WorkspaceReport["lint"];
    test?: WorkspaceReport["test"];
    tsc?: WorkspaceReport["tsc"];
  }
) => {
  return {
    lint: overrides.lint ?? null,
    name,
    test: overrides.test ?? null,
    tsc: overrides.tsc ?? null
  };
};

export const buildErrorMessage = (overrides?: {
  column?: number;
  fixable?: boolean;
  line?: number;
  message?: string;
  ruleId?: null | string;
  severity?: number;
}) => {
  return {
    column: overrides?.column ?? 1,
    fixable: overrides?.fixable ?? true,
    line: overrides?.line ?? 1,
    message: overrides?.message ?? "x",
    ruleId: overrides?.ruleId ?? null,
    severity: overrides?.severity ?? 2
  };
};
