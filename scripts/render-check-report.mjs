#!/usr/bin/env node
// @ts-check
/**
 * Render the JSON report emitted by repo-ai-check.ps1 as a tight, LLM-readable
 * markdown document using @ethang/markdown-generator.
 *
 * Usage (driven by repo-ai-check.ps1):
 *   ConvertTo-Json $finalResult -Depth 12 | node scripts/render-check-report.mjs
 *
 * - Reads the JSON payload from stdin.
 * - Imports @ethang/markdown-generator via its file URL so it works regardless
 *   of CWD or whether the consumer has the package as a hoisted dependency.
 * - Projects the JSON into a MarkdownDocument and prints the rendered text.
 * - Exit codes: 0 success, 1 invalid/empty stdin, 2 render failure.
 */

import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const MESSAGE_MAX = 240;

const trim = (s, n) => {
  if (typeof s !== "string") {
    return "";
  }
  return s.length > n ? `${s.slice(0, n - 3)}...` : s;
};

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? chunk : chunk.toString("utf8"));
  }
  return chunks.join("");
};

const pluralize = (n, singular) => {
  return `${n.toString()} ${singular}${n === 1 ? "" : "s"}`;
};

const main = async () => {
  const raw = (await readStdin()).trim();
  if (raw.length === 0) {
    process.stderr.write("render-check-report: empty stdin (expected JSON from repo-ai-check.ps1)\n");
    process.exit(1);
  }

  let report;
  try {
    report = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(`render-check-report: failed to parse stdin JSON: ${err && err.message ? err.message : String(err)}\n`);
    process.exit(1);
  }

  const dynamicImport = new Function("specifier", "return import(specifier)");
  // Resolve the workspace package by file URL so we don't depend on hoisting
  // or on the consumer having @ethang/markdown-generator in its node_modules.
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const repoRoot = resolve(__dirname, "..");
  const mdEntryUrl = pathToFileURL(resolve(repoRoot, "packages/markdown-generator/src/markdown-generator.ts")).href;
  const mdModule = await dynamicImport(mdEntryUrl);
  const { generateMarkdown, bold, inlineCode } = mdModule;

  const summary = report?.summary ?? {};
  const workspaces = Array.isArray(report?.workspaces) ? report.workspaces : [];

  const headerLines = [];
  const exitCode = typeof report?.exitCode === "number" ? report.exitCode : 0;
  const durationMs = typeof report?.durationMs === "number" ? report.durationMs : 0;
  const durationSec = (durationMs / 1000).toFixed(1);
  const status = exitCode === 0 ? "PASS" : "FAIL";
  headerLines.push({ level: 1, text: `Exit code: ${exitCode.toString()} - ${status}  (${durationSec}s, ${pluralize(summary.workspaces ?? workspaces.length, "workspace")} checked)`, type: "header" });

  // ---- summary table (always) ----
  const lintStats = summary.lint ?? {};
  const tscStats = summary.tsc ?? {};
  const testStats = summary.test ?? {};
  const summaryTable = {
    type: "table",
    headers: [
      { text: "check", align: "left" },
      { text: "ran", align: "right" },
      { text: "passed", align: "right" },
      { text: "failed", align: "right" },
      { text: "errors", align: "right" },
      { text: "warnings", align: "right" }
    ],
    rows: [
      ["lint", String(lintStats.ran ?? 0), String(lintStats.passed ?? 0), String(lintStats.failed ?? 0), String(lintStats.errorCount ?? 0), String(lintStats.warningCount ?? 0)],
      ["tsc", String(tscStats.ran ?? 0), String(tscStats.passed ?? 0), String(tscStats.failed ?? 0), String(tscStats.errorCount ?? 0), String(tscStats.warningCount ?? 0)],
      ["test", String(testStats.ran ?? 0), String(testStats.passed ?? 0), String(testStats.failed ?? 0), "-", "-"]
    ]
  };

  const blocks = [];
  for (const header of headerLines) {
    blocks.push(header);
  }
  blocks.push({ count: 1, type: "space" });
  blocks.push({ level: 2, text: "Summary", type: "header" });
  blocks.push(summaryTable);
  blocks.push({ count: 1, type: "space" });

  // ---- autofix aggregate (only when --fix was used) ----
  if (lintStats.autofix?.ran) {
    const autofixLines = [];
    const totalFixedErrors = lintStats.autofix?.fixedErrorCount ?? 0;
    const totalFixedWarnings = lintStats.autofix?.fixedWarningCount ?? 0;
    const byRule = Array.isArray(lintStats.autofix?.byRule) ? lintStats.autofix.byRule : [];
    for (const ws of workspaces) {
      const wsAutofix = ws.lint?.autofix;
      if (!wsAutofix) {
        continue;
      }
      const fixedErrors = wsAutofix.fixedErrorCount ?? 0;
      const fixedWarnings = wsAutofix.fixedWarningCount ?? 0;
      if (fixedErrors + fixedWarnings === 0) {
        continue;
      }
      const topRules = (wsAutofix.byRule ?? []).slice(0, 5);
      const topRulesText = topRules.length === 0 ? "no rules" : topRules.map((r) => {
        const total = (r.fixedErrorCount ?? 0) + (r.fixedWarningCount ?? 0);
        return `${inlineCode(r.ruleId ?? "(unknown)")} (${total.toString()})`;
      }).join(", ");
      autofixLines.push(`- ${bold(ws.name)}: ${pluralize(fixedErrors, "error")} / ${pluralize(fixedWarnings, "warning")} fixed; top rules: ${topRulesText}`);
    }
    if (autofixLines.length > 0) {
      blocks.push({ level: 2, text: "Autofix applied", type: "header" });
      for (const line of autofixLines) {
        blocks.push({ text: line, type: "text" });
      }
      blocks.push({ text: bold(`Total: ${pluralize(totalFixedErrors, "error")} / ${pluralize(totalFixedWarnings, "warning")} fixed across ${pluralize(lintStats.autofix.ranInWorkspaces ?? autofixLines.length, "workspace")}.`), type: "text" });
      blocks.push({ count: 1, type: "space" });
    } else if (byRule.length > 0) {
      blocks.push({ level: 2, text: "Autofix applied", type: "header" });
      blocks.push({ text: `${pluralize(totalFixedErrors, "error")} / ${pluralize(totalFixedWarnings, "warning")} fixed across the run.`, type: "text" });
      blocks.push({ count: 1, type: "space" });
    }
  }

  // ---- per-workspace sections (failed first, then warnings, then passed list) ----
  const failedWorkspaces = workspaces.filter((ws) => (ws.lint && !ws.lint.passed) || (ws.tsc && !ws.tsc.passed) || (ws.test && !ws.test.passed));
  const passedWorkspaces = workspaces.filter((ws) => !failedWorkspaces.includes(ws));

  const formatLintIssues = (ws) => {
    const lint = ws.lint;
    if (!lint || !lint.ran) {
      return [];
    }
    const lines = [];
    const errors = lint.errorCount ?? 0;
    const warnings = lint.warningCount ?? 0;
    const autofix = lint.autofix;
    const headerSuffix = autofix ? ` (autofix ${autofix.fixedErrorCount ?? 0}/${autofix.fixedWarningCount ?? 0} already applied)` : "";
    lines.push({ level: 4, text: `lint - ${pluralize(errors, "error")} / ${pluralize(warnings, "warning")}${headerSuffix}`, type: "header" });
    const issues = Array.isArray(lint.issues) ? lint.issues : [];
    if (issues.length === 0) {
      lines.push({ text: errors + warnings === 0 ? "(no diagnostics)" : "(no detail; see autofix delta above)", type: "text" });
      return lines;
    }
    let i = 1;
    for (const issue of issues) {
      const loc = `${issue.file ?? "(unknown)"}:${String(issue.line ?? 0)}:${String(issue.column ?? 0)}`;
      const rule = issue.ruleId ? inlineCode(issue.ruleId) : "(parse error)";
      const sev = issue.severity === 2 ? "error" : issue.severity === 1 ? "warning" : "fatal";
      lines.push({ text: `${i.toString()}. ${inlineCode(loc)}  ${rule} [${sev}]  ${trim(issue.message ?? "", MESSAGE_MAX)}`, type: "text" });
      i += 1;
    }
    if (autofix && (autofix.fixedErrorCount ?? 0) + (autofix.fixedWarningCount ?? 0) > 0) {
      lines.push({ alertType: "NOTE", text: "Autofix already ran; remaining issues need manual edits.", type: "alert" });
    }
    return lines;
  };

  const formatTscDiagnostics = (ws) => {
    const tsc = ws.tsc;
    if (!tsc || !tsc.ran) {
      return [];
    }
    const lines = [];
    const errors = tsc.errorCount ?? 0;
    const warnings = tsc.warningCount ?? 0;
    lines.push({ level: 4, text: `tsc - ${pluralize(errors, "error")} / ${pluralize(warnings, "warning")}`, type: "header" });
    const diagnostics = Array.isArray(tsc.diagnostics) ? tsc.diagnostics : [];
    if (diagnostics.length === 0) {
      lines.push({ text: errors + warnings === 0 ? "(no diagnostics)" : "(no detail)", type: "text" });
      return lines;
    }
    let i = 1;
    for (const diag of diagnostics) {
      const loc = `${diag.file ?? "(unknown)"}:${String(diag.line ?? 0)}:${String(diag.column ?? 0)}`;
      const code = diag.code ? inlineCode(diag.code) : "(no code)";
      lines.push({ text: `${i.toString()}. ${inlineCode(loc)}  ${code}  ${trim(diag.message ?? "", MESSAGE_MAX)}`, type: "text" });
      i += 1;
    }
    return lines;
  };

  const formatTests = (ws) => {
    const test = ws.test;
    if (!test || !test.ran) {
      return [];
    }
    const lines = [];
    if (test.passed) {
      const totals = test.totals ?? {};
      const passed = totals.passed ?? 0;
      const total = totals.total ?? passed;
      lines.push({ level: 4, text: `test - passed (${passed.toString()}/${total.toString()})`, type: "header" });
      return lines;
    }
    const failing = Array.isArray(test.failingTests) ? test.failingTests : [];
    lines.push({ level: 4, text: `test - ${pluralize(failing.length, "failing test")}`, type: "header" });
    if (failing.length === 0) {
      const tail = test.parseError
        ? `vitest parse error: ${test.parseError}`
        : (typeof test.exitCode === "number" && test.exitCode !== 0)
          ? `vitest exited with code ${test.exitCode.toString()} but reported no test-level failures.`
          : "no failing-test detail available";
      lines.push({ text: `(${tail})`, type: "text" });
      return lines;
    }
    let i = 1;
    for (const f of failing) {
      const name = f.name ?? f.fullName ?? "(unnamed test)";
      const message = trim(f.message ?? "", MESSAGE_MAX);
      lines.push({ text: `${i.toString()}. ${bold(name)} - ${message}`, type: "text" });
      i += 1;
    }
    if (test.parseError) {
      lines.push({ alertType: "WARNING", text: `vitest parse error: ${test.parseError}`, type: "alert" });
    }
    return lines;
  };

  for (const ws of failedWorkspaces) {
    const title = `${ws.name} (${ws.path ?? ""})`;
    blocks.push({ level: 2, text: `Failed: ${title}`, type: "header" });
    blocks.push({ count: 0, type: "space" });
    for (const b of formatLintIssues(ws)) {
      blocks.push(b);
    }
    for (const b of formatTscDiagnostics(ws)) {
      blocks.push(b);
    }
    for (const b of formatTests(ws)) {
      blocks.push(b);
    }
    if (ws.error) {
      blocks.push({ alertType: "WARNING", text: `Workspace error: ${ws.error}`, type: "alert" });
    }
    blocks.push({ count: 1, type: "space" });
  }

  if (passedWorkspaces.length > 0) {
    blocks.push({ level: 2, text: `Passed (${passedWorkspaces.length.toString()})`, type: "header" });
    const items = passedWorkspaces.map((ws) => ({ text: `${ws.name} (${ws.path ?? ""})` }));
    blocks.push({ items, type: "unorderedList" });
    blocks.push({ count: 1, type: "space" });
  }

  let rendered;
  try {
    rendered = generateMarkdown({ blocks });
  } catch (err) {
    process.stderr.write(`render-check-report: render failed: ${err && err.message ? err.message : String(err)}\n`);
    process.exit(2);
  }

  process.stdout.write(rendered);
};

main().catch((err) => {
  process.stderr.write(`render-check-report: unexpected error: ${err && err.stack ? err.stack : String(err)}\n`);
  process.exit(2);
});
