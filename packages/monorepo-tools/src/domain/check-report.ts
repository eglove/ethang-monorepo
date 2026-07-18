import { DateTime } from "effect";
import filter from "lodash/filter.js";
import isNil from "lodash/isNil.js";
import partition from "lodash/partition.js";
import sumBy from "lodash/sumBy.js";
import take from "lodash/take.js";

import type { AutofixSummary } from "./eslint-autofix.ts";

export type AutofixRuleAggregate = {
  fixedErrorCount: number;
  fixedWarningCount: number;
  ruleId: string;
  workspaceCount: number;
};

export type CheckKind = "coverage" | "lint" | "test" | "tsc";

export type CheckReport = {
  durationMs: number;
  exitCode: 0 | 1;
  finishedAt: string;
  startedAt: string;
  summary: CheckSummary;
  workspaces: readonly WorkspaceReport[];
};

export type CheckSummary = {
  coverage: CoverageSummary;
  lint: LintSummary;
  test: TestSummary;
  tsc: TscSummary;
  workspaces: number;
};

export type CoverageSummary = {
  failed: number;
  passed: number;
  ran: number;
};

export type CoverageWorkspaceReport = {
  passed: boolean;
  ran: boolean;
  summary: {
    branches: { covered: number; pct: number; total: number };
    functions: { covered: number; pct: number; total: number };
    lines: { covered: number; pct: number; total: number };
    statements: { covered: number; pct: number; total: number };
  } | null;
  violations: readonly {
    actual: number;
    metric: "branches" | "functions" | "lines" | "statements";
    required: number;
  }[];
};

export type LintSummary = {
  autofix: {
    byRule: readonly AutofixRuleAggregate[];
    fixedErrorCount: number;
    fixedWarningCount: number;
    ran: boolean;
    ranInWorkspaces: number;
  };
  errorCount: number;
  failed: number;
  passed: number;
  ran: number;
  warningCount: number;
};

export type LintWorkspaceReport = {
  autofix: AutofixSummary | null;
  errorCount: number;
  passed: boolean;
  ran: boolean;
  warningCount: number;
};

export type TestSummary = {
  failed: number;
  failedTestCount: number;
  passed: number;
  ran: number;
};

export type TestWorkspaceReport = {
  failedTests: readonly { readonly name: string }[];
  passed: boolean;
  ran: boolean;
};

export type TscSummary = {
  errorCount: number;
  failed: number;
  passed: number;
  ran: number;
  warningCount: number;
};

export type TscWorkspaceReport = {
  errorCount: number;
  passed: boolean;
  ran: boolean;
  warningCount: number;
};

export type WorkspaceReport = {
  coverage?: CoverageWorkspaceReport | null;
  lint: LintWorkspaceReport | null;
  name: string;
  test: null | TestWorkspaceReport;
  tsc: null | TscWorkspaceReport;
};

const AUTOFIX_TOP_RULE_LIMIT = 10;

const slotOf = <K extends CheckKind>(report: WorkspaceReport, kind: K) => {
  return report[kind];
};

const ranReports = <K extends CheckKind>(
  reports: readonly WorkspaceReport[],
  kind: K
) => {
  return filter(reports, (report) => {
    return true === slotOf(report, kind)?.ran;
  });
};

const passedReports = <K extends CheckKind>(
  reports: readonly WorkspaceReport[],
  kind: K
) => {
  return filter(reports, (report) => {
    return true === slotOf(report, kind)?.passed;
  });
};

const failedReports = <K extends CheckKind>(
  reports: readonly WorkspaceReport[],
  kind: K
) => {
  return filter(reports, (report) => {
    const slot = slotOf(report, kind);
    return true === slot?.ran && !slot.passed;
  });
};

const sumLintErrors = (reports: readonly WorkspaceReport[]) => {
  return sumBy(reports, (report) => {
    return report.lint?.errorCount ?? 0;
  });
};

const sumLintWarnings = (reports: readonly WorkspaceReport[]) => {
  return sumBy(reports, (report) => {
    return report.lint?.warningCount ?? 0;
  });
};

const sumTscErrors = (reports: readonly WorkspaceReport[]) => {
  return sumBy(reports, (report) => {
    return report.tsc?.errorCount ?? 0;
  });
};

const sumTscWarnings = (reports: readonly WorkspaceReport[]) => {
  return sumBy(reports, (report) => {
    return report.tsc?.warningCount ?? 0;
  });
};

const sumFailedTests = (reports: readonly WorkspaceReport[]) => {
  return sumBy(reports, (report) => {
    return report.test?.failedTests.length ?? 0;
  });
};

const autofixOf = (report: WorkspaceReport) => {
  return report.lint?.autofix;
};

const hasAutofix = (report: WorkspaceReport) => {
  return !isNil(autofixOf(report));
};

const sumAutofixErrors = (reports: readonly WorkspaceReport[]) => {
  return sumBy(reports, (report) => {
    return autofixOf(report)?.fixedErrorCount ?? 0;
  });
};

const sumAutofixWarnings = (reports: readonly WorkspaceReport[]) => {
  return sumBy(reports, (report) => {
    return autofixOf(report)?.fixedWarningCount ?? 0;
  });
};

const countAutofixWorkspaces = (reports: readonly WorkspaceReport[]) => {
  const [withAutofix] = partition(reports, hasAutofix);
  return withAutofix.length;
};

const accumulateRuleAggregate = (
  buckets: Map<
    string,
    {
      fixedErrorCount: number;
      fixedWarningCount: number;
      workspaceCount: number;
    }
  >,
  ruleId: string,
  rule: AutofixSummary["byRule"][number]
) => {
  const existing = buckets.get(ruleId);
  if (existing) {
    existing.fixedErrorCount += rule.fixedErrorCount;
    existing.fixedWarningCount += rule.fixedWarningCount;
    existing.workspaceCount += 1;
    return;
  }
  buckets.set(ruleId, {
    fixedErrorCount: rule.fixedErrorCount,
    fixedWarningCount: rule.fixedWarningCount,
    workspaceCount: 1
  });
};

const accumulateRulesFromAutofix = (
  buckets: Map<
    string,
    {
      fixedErrorCount: number;
      fixedWarningCount: number;
      workspaceCount: number;
    }
  >,
  reports: readonly WorkspaceReport[]
) => {
  for (const report of reports) {
    const autofix = autofixOf(report);
    if (isNil(autofix)) {
      return;
    }
    for (const rule of autofix.byRule) {
      accumulateRuleAggregate(buckets, rule.ruleId, rule);
    }
  }
};

const buildAggregateByRule = (reports: readonly WorkspaceReport[]) => {
  const buckets = new Map<
    string,
    {
      fixedErrorCount: number;
      fixedWarningCount: number;
      workspaceCount: number;
    }
  >();
  accumulateRulesFromAutofix(buckets, reports);
  const aggregates: AutofixRuleAggregate[] = [];
  for (const [ruleId, value] of buckets) {
    aggregates.push({
      fixedErrorCount: value.fixedErrorCount,
      fixedWarningCount: value.fixedWarningCount,
      ruleId,
      workspaceCount: value.workspaceCount
    });
  }
  aggregates.sort((left, right) => {
    const leftTotal = left.fixedErrorCount + left.fixedWarningCount;
    const rightTotal = right.fixedErrorCount + right.fixedWarningCount;
    if (leftTotal !== rightTotal) {
      return rightTotal - leftTotal;
    }
    return left.ruleId.localeCompare(right.ruleId);
  });
  return take(aggregates, AUTOFIX_TOP_RULE_LIMIT);
};

const computeLintSummary = (
  reports: readonly WorkspaceReport[],
  isAutofixRan: boolean
) => {
  return {
    autofix: {
      byRule: buildAggregateByRule(reports),
      fixedErrorCount: sumAutofixErrors(reports),
      fixedWarningCount: sumAutofixWarnings(reports),
      ran: isAutofixRan,
      ranInWorkspaces: countAutofixWorkspaces(reports)
    },
    errorCount: sumLintErrors(reports),
    failed: failedReports(reports, "lint").length,
    passed: passedReports(reports, "lint").length,
    ran: ranReports(reports, "lint").length,
    warningCount: sumLintWarnings(reports)
  };
};

const computeTscSummary = (reports: readonly WorkspaceReport[]) => {
  return {
    errorCount: sumTscErrors(reports),
    failed: failedReports(reports, "tsc").length,
    passed: passedReports(reports, "tsc").length,
    ran: ranReports(reports, "tsc").length,
    warningCount: sumTscWarnings(reports)
  };
};

const computeTestSummary = (reports: readonly WorkspaceReport[]) => {
  return {
    failed: failedReports(reports, "test").length,
    failedTestCount: sumFailedTests(reports),
    passed: passedReports(reports, "test").length,
    ran: ranReports(reports, "test").length
  };
};

const computeExitCode = (summary: CheckSummary) => {
  return 0 <
    summary.lint.failed +
      summary.tsc.failed +
      summary.test.failed +
      summary.coverage.failed
    ? (1 as const)
    : (0 as const);
};

const computeCoverageSummary = (reports: readonly WorkspaceReport[]) => {
  return {
    failed: failedReports(reports, "coverage").length,
    passed: passedReports(reports, "coverage").length,
    ran: ranReports(reports, "coverage").length
  };
};

export const buildCheckReport = (
  startedAt: string,
  finishedAt: string,
  workspaces: readonly WorkspaceReport[],
  isAutofixRan: boolean
) => {
  const summary: CheckSummary = {
    coverage: computeCoverageSummary(workspaces),
    lint: computeLintSummary(workspaces, isAutofixRan),
    test: computeTestSummary(workspaces),
    tsc: computeTscSummary(workspaces),
    workspaces: workspaces.length
  };
  const durationMs =
    DateTime.toEpochMillis(DateTime.unsafeMake(finishedAt)) -
    DateTime.toEpochMillis(DateTime.unsafeMake(startedAt));
  return {
    durationMs,
    exitCode: computeExitCode(summary),
    finishedAt,
    startedAt,
    summary,
    workspaces
  };
};
