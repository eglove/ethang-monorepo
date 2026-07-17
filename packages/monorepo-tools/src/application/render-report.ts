/**
Orchestrate rendering a CheckReport JSON as markdown.

Consumes the check-report result produced by the monorepo checker,
projects it to a `MarkdownDocument` from `@ethang/markdown-generator`,
and renders the markdown. The checker passes `--format Markdown`
(the default) and writes the rendered text to stdout.
*/

/* eslint-disable @ethang/prefer-lodash, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/strict-boolean-expressions, no-continue, no-nested-ternary, sonar/cognitive-complexity, sonar/cyclomatic-complexity, sonar/elseif-without-else, sonar/expression-complexity, sonar/no-nested-conditional, sonar/too-many-break-or-continue-in-loop, unicorn/prefer-single-call */

import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.ts";

import { Effect, Schema } from "effect";
import isEmpty from "lodash/isEmpty.js";
import isNumber from "lodash/isNumber.js";
import isPlainObject from "lodash/isPlainObject.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";

const MESSAGE_MAX = 240;

export const trimMessage = (s: null | string, n: number) => {
  if (!isString(s)) {
    return "";
  }
  return s.length > n ? `${s.slice(0, n - 3)}...` : s;
};

const pluralize = (n: number, singular: string) => {
  return `${n.toString()} ${singular}${1 === n ? "" : "s"}`;
};

export type RenderReportOptions = {
  readonly reportText: string;
};

export type ReportJson = {
  readonly durationMs?: number;
  readonly exitCode?: number;
  readonly summary?: Summary;
  readonly workspaces?: readonly WorkspaceReport[];
};

export type WorkspaceReport = {
  readonly error?: string;
  readonly lint?: WorkspaceLint;
  readonly name?: string;
  readonly path?: string;
  readonly test?: WorkspaceTest;
  readonly tsc?: WorkspaceTsc;
};

type Summary = {
  readonly lint?: SummaryLint;
  readonly test?: SummaryTest;
  readonly tsc?: SummaryTsc;
  readonly workspaces?: number;
};

type SummaryAutofix = {
  readonly byRule?: readonly {
    readonly fixedErrorCount?: number;
    readonly fixedWarningCount?: number;
    readonly ruleId?: string;
  }[];
  readonly fixedErrorCount?: number;
  readonly fixedWarningCount?: number;
  readonly ran?: boolean;
  readonly ranInWorkspaces?: number;
};

type SummaryLint = {
  readonly autofix?: SummaryAutofix;
  readonly errorCount?: number;
  readonly failed?: number;
  readonly passed?: number;
  readonly ran?: number;
  readonly warningCount?: number;
};

type SummaryTest = {
  readonly failed?: number;
  readonly passed?: number;
  readonly ran?: number;
};

type SummaryTsc = {
  readonly errorCount?: number;
  readonly failed?: number;
  readonly passed?: number;
  readonly ran?: number;
  readonly warningCount?: number;
};

type WorkspaceLint = {
  readonly autofix?: {
    readonly byRule?: readonly {
      readonly fixedErrorCount?: number;
      readonly fixedWarningCount?: number;
      readonly ruleId?: string;
    }[];
    readonly fixedErrorCount?: number;
    readonly fixedWarningCount?: number;
  };
  readonly errorCount?: number;
  readonly issues?: readonly {
    readonly column?: number;
    readonly file?: string;
    readonly line?: number;
    readonly message?: string;
    readonly ruleId?: string;
    readonly severity?: number;
  }[];
  readonly passed?: boolean;
  readonly ran?: boolean;
  readonly warningCount?: number;
};

type WorkspaceTest = {
  readonly exitCode?: number;
  readonly failingTests?: readonly {
    readonly message?: string;
    readonly name?: string;
  }[];
  readonly parseError?: string;
  readonly passed?: boolean;
  readonly ran?: boolean;
  readonly totals?: { readonly passed?: number; readonly total?: number };
};

type WorkspaceTsc = {
  readonly diagnostics?: readonly {
    readonly code?: string;
    readonly column?: number;
    readonly file?: string;
    readonly line?: number;
    readonly message?: string;
  }[];
  readonly errorCount?: number;
  readonly passed?: boolean;
  readonly ran?: boolean;
  readonly warningCount?: number;
};

const ReportJsonSchema = Schema.Unknown.pipe(
  Schema.filter((value): value is ReportJson => {
    return isPlainObject(value);
  })
);

const workspaceCountOf = (report: ReportJson, summary: Summary) => {
  if (isNumber(summary.workspaces)) {
    return summary.workspaces;
  }
  if (Array.isArray(report.workspaces)) {
    return report.workspaces.length;
  }
  return 0;
};

const buildHeaderBlock = (report: ReportJson) => {
  const exitCode = isNumber(report.exitCode) ? report.exitCode : 0;
  const durationMs = isNumber(report.durationMs) ? report.durationMs : 0;
  const durationSec = (durationMs / 1000).toFixed(1);
  const status = 0 === exitCode ? "PASS" : "FAIL";
  const summary = report.summary ?? {};
  const workspaceCount = workspaceCountOf(report, summary);
  return {
    level: 1 as const,
    text: `Exit code: ${exitCode.toString()} - ${status}  (${durationSec}s, ${pluralize(workspaceCount, "workspace")} checked)`,
    type: "header" as const
  };
};

const buildSummaryTableBlock = (summary: Summary) => {
  const lintStats = summary?.lint ?? {};
  const tscStats = summary?.tsc ?? {};
  const testStats = summary?.test ?? {};
  return {
    headers: [
      { align: "left" as const, text: "check" },
      { align: "right" as const, text: "ran" },
      { align: "right" as const, text: "passed" },
      { align: "right" as const, text: "failed" },
      { align: "right" as const, text: "errors" },
      { align: "right" as const, text: "warnings" }
    ],
    rows: [
      [
        "lint",
        String(lintStats.ran ?? 0),
        String(lintStats.passed ?? 0),
        String(lintStats.failed ?? 0),
        String(lintStats.errorCount ?? 0),
        String(lintStats.warningCount ?? 0)
      ],
      [
        "tsc",
        String(tscStats.ran ?? 0),
        String(tscStats.passed ?? 0),
        String(tscStats.failed ?? 0),
        String(tscStats.errorCount ?? 0),
        String(tscStats.warningCount ?? 0)
      ],
      [
        "test",
        String(testStats.ran ?? 0),
        String(testStats.passed ?? 0),
        String(testStats.failed ?? 0),
        "-",
        "-"
      ]
    ],
    type: "table" as const
  };
};

const buildAutofixBlocks = (
  workspaces: readonly WorkspaceReport[],
  summary: Summary
) => {
  const blocks: MarkdownBlock[] = [];
  const lintStats = summary?.lint;
  const autofix = lintStats?.autofix;
  if (!autofix?.ran) {
    return blocks;
  }

  const autofixLines: string[] = [];
  for (const ws of workspaces) {
    const wsAutofix = ws.lint?.autofix;
    if (!wsAutofix) {
      continue;
    }
    const fixedErrors = wsAutofix.fixedErrorCount ?? 0;
    const fixedWarnings = wsAutofix.fixedWarningCount ?? 0;
    if (0 === fixedErrors + fixedWarnings) {
      continue;
    }
    const topRules = (wsAutofix.byRule ?? []).slice(0, 5);
    const topRulesText = isEmpty(topRules)
      ? "no rules"
      : map(topRules, (r) => {
          const total = (r.fixedErrorCount ?? 0) + (r.fixedWarningCount ?? 0);
          return `\`${r.ruleId ?? "(unknown)"}\` (${total.toString()})`;
        }).join(", ");
    autofixLines.push(
      `- **${ws.name ?? "(unnamed)"}**: ${pluralize(fixedErrors, "error")} / ${pluralize(fixedWarnings, "warning")} fixed; top rules: ${topRulesText}`
    );
  }

  const totalFixedErrors = autofix.fixedErrorCount ?? 0;
  const totalFixedWarnings = autofix.fixedWarningCount ?? 0;
  const byRule = Array.isArray(autofix.byRule) ? autofix.byRule : [];

  if (0 < autofixLines.length) {
    blocks.push({ level: 2, text: "Autofix applied", type: "header" });
    for (const line of autofixLines) {
      blocks.push({ text: line, type: "text" });
    }
    blocks.push(
      {
        text: `**Total**: ${pluralize(totalFixedErrors, "error")} / ${pluralize(totalFixedWarnings, "warning")} fixed across ${pluralize(autofix.ranInWorkspaces ?? autofixLines.length, "workspace")}.`,
        type: "text"
      },
      { count: 1, type: "space" }
    );
  } else if (0 < byRule.length) {
    blocks.push({ level: 2, text: "Autofix applied", type: "header" });
    blocks.push(
      {
        text: `${pluralize(totalFixedErrors, "error")} / ${pluralize(totalFixedWarnings, "warning")} fixed across the run.`,
        type: "text"
      },
      { count: 1, type: "space" }
    );
  }
  return blocks;
};

const formatLintIssues = (lint: WorkspaceLint) => {
  const lines: MarkdownBlock[] = [];
  const errors = lint.errorCount ?? 0;
  const warnings = lint.warningCount ?? 0;
  const { autofix } = lint;
  const headerSuffix = autofix
    ? ` (autofix ${autofix.fixedErrorCount ?? 0}/${autofix.fixedWarningCount ?? 0} already applied)`
    : "";
  lines.push({
    level: 3,
    text: `lint - ${pluralize(errors, "error")} / ${pluralize(warnings, "warning")}${headerSuffix}`,
    type: "header"
  });
  const issues = Array.isArray(lint.issues) ? lint.issues : [];
  if (isEmpty(issues)) {
    lines.push({
      text:
        0 === errors + warnings
          ? "(no diagnostics)"
          : "(no detail; see autofix delta above)",
      type: "text"
    });
    return lines;
  }
  let index = 1;
  for (const issue of issues) {
    const loc = `${issue.file ?? "(unknown)"}:${String(issue.line ?? 0)}:${String(issue.column ?? 0)}`;
    const rule = issue.ruleId ? `\`${issue.ruleId}\`` : "(parse error)";
    const sev =
      2 === issue.severity
        ? "error"
        : 1 === issue.severity
          ? "warning"
          : "fatal";
    lines.push({
      text: `${index.toString()}. \`${loc}\`  ${rule} [${sev}]  ${trimMessage(issue.message ?? "", MESSAGE_MAX)}`,
      type: "text"
    });
    index += 1;
  }
  if (
    autofix &&
    0 < (autofix.fixedErrorCount ?? 0) + (autofix.fixedWarningCount ?? 0)
  ) {
    lines.push({
      alertType: "NOTE",
      text: "Autofix already ran; remaining issues need manual edits.",
      type: "alert"
    });
  }
  return lines;
};

const formatTscDiagnostics = (tsc: WorkspaceTsc) => {
  const lines: MarkdownBlock[] = [];
  const errors = tsc.errorCount ?? 0;
  const warnings = tsc.warningCount ?? 0;
  lines.push({
    level: 3,
    text: `tsc - ${pluralize(errors, "error")} / ${pluralize(warnings, "warning")}`,
    type: "header"
  });
  const diagnostics = Array.isArray(tsc.diagnostics) ? tsc.diagnostics : [];
  if (isEmpty(diagnostics)) {
    lines.push({
      text: 0 === errors + warnings ? "(no diagnostics)" : "(no detail)",
      type: "text"
    });
    return lines;
  }
  let index = 1;
  for (const diag of diagnostics) {
    const loc = `${diag.file ?? "(unknown)"}:${String(diag.line ?? 0)}:${String(diag.column ?? 0)}`;
    const code = diag.code ? `\`${diag.code}\`` : "(no code)";
    lines.push({
      text: `${index.toString()}. \`${loc}\`  ${code}  ${trimMessage(diag.message ?? "", MESSAGE_MAX)}`,
      type: "text"
    });
    index += 1;
  }
  return lines;
};

const formatTests = (test: WorkspaceTest) => {
  const lines: MarkdownBlock[] = [];
  if (test.passed) {
    const totals = test.totals ?? {};
    const passed = totals.passed ?? 0;
    const total = totals.total ?? passed;
    lines.push({
      level: 3,
      text: `test - passed (${passed.toString()}/${total.toString()})`,
      type: "header"
    });
    return lines;
  }
  const failing = Array.isArray(test.failingTests) ? test.failingTests : [];
  lines.push({
    level: 3,
    text: `test - ${pluralize(failing.length, "failing test")}`,
    type: "header"
  });
  if (isEmpty(failing)) {
    const tail = test.parseError
      ? `vitest parse error: ${test.parseError}`
      : "number" === typeof test.exitCode && 0 !== test.exitCode
        ? `vitest exited with code ${test.exitCode.toString()} but reported no test-level failures.`
        : "no failing-test detail available";
    lines.push({ text: `(${tail})`, type: "text" });
    return lines;
  }
  let index = 1;
  for (const f of failing) {
    const name = f.name ?? "(unnamed test)";
    const message = trimMessage(f.message ?? "", MESSAGE_MAX);
    lines.push({
      text: `${index.toString()}. **${name}** - ${message}`,
      type: "text"
    });
    index += 1;
  }
  if (test.parseError) {
    lines.push({
      alertType: "WARNING",
      text: `vitest parse error: ${test.parseError}`,
      type: "alert"
    });
  }
  return lines;
};

const buildWorkspaceBlocks = (workspaces: readonly WorkspaceReport[]) => {
  const blocks: MarkdownBlock[] = [];
  const failedWorkspaces = workspaces.filter((ws) => {
    return (
      (ws.lint && !ws.lint.passed) ||
      (ws.tsc && !ws.tsc.passed) ||
      (ws.test && !ws.test.passed)
    );
  });
  const passedWorkspaces = workspaces.filter((ws) => {
    return !failedWorkspaces.includes(ws);
  });

  for (const ws of failedWorkspaces) {
    const title = `${ws.name ?? "(unnamed)"} (${ws.path ?? ""})`;
    blocks.push(
      { level: 2, text: `Failed: ${title}`, type: "header" },
      { count: 0, type: "space" }
    );
    if (ws.lint?.ran) {
      for (const b of formatLintIssues(ws.lint)) {
        blocks.push(b);
      }
    }
    if (ws.tsc?.ran) {
      for (const b of formatTscDiagnostics(ws.tsc)) {
        blocks.push(b);
      }
    }
    if (ws.test?.ran) {
      for (const b of formatTests(ws.test)) {
        blocks.push(b);
      }
    }
    if (ws.error) {
      blocks.push({
        alertType: "WARNING",
        text: `Workspace error: ${ws.error}`,
        type: "alert"
      });
    }
    blocks.push({ count: 1, type: "space" });
  }

  if (0 < passedWorkspaces.length) {
    blocks.push({
      level: 2,
      text: `Passed (${passedWorkspaces.length.toString()})`,
      type: "header"
    });
    blocks.push(
      {
        items: map(passedWorkspaces, (ws) => {
          return {
            text: `${ws.name ?? "(unnamed)"} (${ws.path ?? ""})`
          };
        }),
        type: "unorderedList"
      },
      { count: 1, type: "space" }
    );
  }

  return blocks;
};

const buildBlocks = (report: ReportJson) => {
  const blocks: MarkdownBlock[] = [];
  const summary = report?.summary ?? {};
  const workspaces = Array.isArray(report?.workspaces) ? report.workspaces : [];

  blocks.push(
    buildHeaderBlock(report),
    { count: 1, type: "space" },
    { level: 2, text: "Summary", type: "header" }
  );
  blocks.push(buildSummaryTableBlock(summary), { count: 1, type: "space" });

  const autofixBlocks = buildAutofixBlocks(workspaces, summary);
  for (const b of autofixBlocks) {
    blocks.push(b);
  }

  const workspaceBlocks = buildWorkspaceBlocks(workspaces);
  for (const b of workspaceBlocks) {
    blocks.push(b);
  }

  return blocks;
};

export const renderReport = (options: RenderReportOptions) => {
  return Effect.sync(() => {
    const report = Schema.decodeUnknownSync(ReportJsonSchema)(
      JSON.parse(options.reportText)
    );
    return { blocks: buildBlocks(report) };
  });
};

export const { blocks: buildReportBlocks } = { blocks: buildBlocks };
