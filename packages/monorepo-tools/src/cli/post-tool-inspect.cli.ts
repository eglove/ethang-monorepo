#!/usr/bin/env bun

/**
transform_tool_result hook: read Hermes JSON from stdin, apply ESLint --fix,
call WebStorm MCP get_file_problems, emit a JSON envelope on stdout.

stdin (transform_tool_result payload from Hermes):
  {
    "hook_event_name": "transform_tool_result",
    "tool_name": "patch" | "write_file",
    "tool_input": {"path": "rel/path.ts", ...},
    "cwd": "/abs/path/to/repo",
    "extra": {"result": "<original tool return string>", ...}
  }

stdout:
  {"result": "<original>\n\n<diagnostics markdown>"}   when issues are found
  {}                                                   when clean (pass through)
*/

import { Effect } from "effect";
import process from "node:process";

import { inspectAfterTool } from "../application/inspect-after-tool.ts";

export type HermesTransformPayload = {
  cwd?: string;
  extra?: { result?: string };
  tool_input?: { path?: string };
};

export const readStdinText = async (stdin: AsyncIterable<unknown>) => {
  const chunks: string[] = [];
  for await (const chunk of stdin) {
    chunks.push(String(chunk));
  }
  return chunks.join("");
};

const SEPARATOR = "\n\n";

export const buildTransformedResult = (
  originalResult: string,
  diagnostics: string
): string => {
  if (!diagnostics) {
    return originalResult;
  }
  return `${originalResult}${SEPARATOR}${diagnostics}`;
};

const parsePayload = (raw: string): HermesTransformPayload | null => {
  try {
    return JSON.parse(raw) as HermesTransformPayload;
  } catch {
    return null;
  }
};

const extractPathAndCwd = (payload: HermesTransformPayload) => {
  const filePath = payload.tool_input?.path;
  const cwd = payload.cwd;
  return { cwd, filePath };
};

export const main = async (stdin: AsyncIterable<unknown>) => {
  const stdinPayload = await readStdinText(stdin);
  const parsed = parsePayload(stdinPayload);

  if (!parsed) {
    process.stdout.write("{}\n");
    return;
  }

  const { cwd, filePath } = extractPathAndCwd(parsed);
  const originalResult = parsed.extra?.result ?? "";

  if (!filePath || !cwd) {
    process.stdout.write("{}\n");
    return;
  }

  const diagnostics = await Effect.runPromise(
    inspectAfterTool({ filePath, cwd })
  ).catch((): string => "");

  if (!diagnostics) {
    process.stdout.write("{}\n");
    return;
  }

  const combined = buildTransformedResult(originalResult, diagnostics);
  process.stdout.write(`${JSON.stringify({ result: combined })}\n`);
};

/* v8 ignore next 3 -- import.meta.main is true only when Bun launches this CLI. */
if (import.meta.main) {
  await main(process.stdin);
}
