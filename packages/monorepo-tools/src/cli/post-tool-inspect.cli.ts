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
  const result = await Effect.runPromise(inspectAfterTool({ stdinPayload }));
  process.stdout.write(`${JSON.stringify(result)}\n`);
};

/* v8 ignore next 3 -- import.meta.main is true only when Bun launches this CLI. */
if (import.meta.main) {
  await main(process.stdin);
}
