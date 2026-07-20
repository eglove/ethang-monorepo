#!/usr/bin/env bun

/**
PostToolUse hook script: read JSON from stdin, apply ESLint --fix,
call WebStorm MCP get_file_problems, return diagnostics envelope.

Usage:
  <stdin contains PostToolUse payload> | bun src/cli/post-tool-inspect.cli.ts

stdout = { "additionalContext": "..." }
*/

import { Effect } from "effect";
import process from "node:process";

import { inspectAfterTool } from "../application/inspect-after-tool.ts";

export const readStdinText = async (stdin: AsyncIterable<unknown>) => {
  const chunks: string[] = [];
  for await (const chunk of stdin) {
    chunks.push(String(chunk));
  }
  return chunks.join("");
};

export const main = async (stdin: AsyncIterable<unknown>) => {
  const stdinPayload = await readStdinText(stdin);

  // Parse Hermes hook payload
  let payload: any;
  try {
    payload = JSON.parse(stdinPayload);
  } catch {
    process.stdout.write('{}\n');
    return;
  }

  // Extract file path and cwd from Hermes post_tool_call payload
  const filePath = payload?.tool_input?.path;
  const cwd = payload?.cwd;

  if (!filePath || !cwd) {
    process.stdout.write('{}\n');
    return;
  }

  // Run ESLint fix as side effect (post_tool_call hooks ignore return value)
  await Effect.runPromise(
    inspectAfterTool({ filePath, cwd })
  ).catch(() => {});

  // Return empty JSON (Hermes post_tool_call ignores return value)
  process.stdout.write('{}\n');
};

/* v8 ignore next 3 -- import.meta.main is true only when Bun launches this CLI. */
if (import.meta.main) {
  await main(process.stdin);
}
