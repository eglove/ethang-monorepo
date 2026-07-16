#!/usr/bin/env node
// @ts-check
/**
 * ESLint autofix telemetry shim for repo-ai-check.ps1.
 *
 * Why this exists:
 *   The parent PowerShell script runs `eslint --fix` and previously only
 *   reported the post-fix result, so the LLM had no idea which issues the
 *   script silently rewrote on disk. This shim uses the ESLint Node API so
 *   we can capture both the pre-fix and post-fix message lists and emit a
 *   diff the parent script can summarize.
 *
 * Cost:
 *   Two ESLint passes per workspace (one before outputFixes, one after to
 *   read the now-fixed files from disk). AST parsing is the dominant cost,
 *   so total wall time is roughly 2x the single CLI call this replaces.
 *
 * Usage:
 *   node scripts/eslint-autofix.mjs --cwd <workspace-dir> --files <json-array>
 *
 * Output (single JSON document on stdout):
 *   {
 *     "cwd": "...",
 *     "files": ["..."],
 *     "results": [
 *       {
 *         "filePath": "...",
 *         "preFixMessages":  [{ ruleId, severity, line, column, message, fixable }],
 *         "postFixMessages": [{ ruleId, severity, line, column, message, fixable }]
 *       }
 *     ]
 *   }
 *
 * Paths in `results[].filePath` are normalized to POSIX style for
 * cross-platform consistency with the rest of repo-ai-check.ps1.
 *
 * Exit codes:
 *   0 = success (even if messages were found; the parent decides pass/fail).
 *   1 = config/load error or invalid arguments.
 *   2 = unexpected exception.
 */

import process from "node:process";
import path from "node:path";

function fail(msg) {
  process.stderr.write(`eslint-autofix: ${msg}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  let cwd;
  let filesRaw;
  // Resolve cwd to an absolute path because ESLint's Node API rejects
  // relative `cwd` values. We deliberately do not require it to exist
  // (the caller may pass the script before running pnpm install).
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--cwd") {
      cwd = argv[++i];
    } else if (a === "--files") {
      filesRaw = argv[++i];
    } else if (a === "--help" || a === "-h") {
      process.stdout.write("Usage: node scripts/eslint-autofix.mjs --cwd <dir> --files <json-array>\n");
      process.exit(0);
    } else {
      fail(`Unknown argument: ${a}`);
    }
  }
  if (!cwd) fail("Missing --cwd <directory>");
  if (!filesRaw) fail("Missing --files <json-array>");
  cwd = path.resolve(cwd);
  let files;
  try {
    const parsed = JSON.parse(filesRaw);
    if (!Array.isArray(parsed) || !parsed.every((f) => typeof f === "string")) {
      throw new Error("files must be a JSON array of strings");
    }
    files = parsed;
  } catch (err) {
    fail(`Invalid --files JSON: ${err.message}`);
  }
  return { cwd, files };
}

function normalize(filePath, cwd) {
  const absolute = path.isAbsolute(filePath) ? filePath : path.resolve(cwd, filePath);
  const rel = path.relative(cwd, absolute);
  return rel.split(path.sep).join("/");
}

function projectMessage(msg) {
  return {
    ruleId: msg.ruleId ?? null,
    severity: msg.severity ?? 1,
    line: msg.line ?? 0,
    column: msg.column ?? 0,
    message: msg.message ?? "",
    fixable: Boolean(msg.fix),
  };
}

async function main() {
  const { cwd, files } = parseArgs(process.argv.slice(2));

  let eslint;
  try {
    const mod = await import("eslint");
    const ESLint = mod.ESLint ?? mod.default?.ESLint;
    if (!ESLint) throw new Error("ESLint class not found in 'eslint' module export");
    eslint = new ESLint({ cwd, fix: true });
  } catch (err) {
    fail(`Failed to load ESLint: ${err.message}`);
  }

  let preResults;
  try {
    preResults = await eslint.lintFiles(files);
  } catch (err) {
    fail(`eslint.lintFiles (pre-fix) failed: ${err.message}`);
  }

  try {
    const mod = await import("eslint");
    await mod.ESLint.outputFixes(preResults);
  } catch (err) {
    fail(`ESLint.outputFixes failed: ${err.message}`);
  }

  let postResults;
  try {
    postResults = await eslint.lintFiles(files);
  } catch (err) {
    fail(`eslint.lintFiles (post-fix) failed: ${err.message}`);
  }

  const postByAbs = new Map();
  for (const r of postResults) {
    postByAbs.set(path.resolve(r.filePath), r.messages ?? []);
  }

  const results = preResults.map((pre) => {
    const postMessages = postByAbs.get(path.resolve(pre.filePath)) ?? [];
    return {
      filePath: normalize(pre.filePath, cwd),
      preFixMessages: (pre.messages ?? []).map(projectMessage),
      postFixMessages: postMessages.map(projectMessage),
    };
  });

  const output = {
    cwd,
    files: files.map((f) => normalize(f, cwd)),
    results,
  };

  process.stdout.write(`${JSON.stringify(output)}\n`);
}

main().catch((err) => {
  process.stderr.write(`eslint-autofix: unexpected error: ${err?.stack ?? err}\n`);
  process.exit(2);
});

