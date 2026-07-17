#!/usr/bin/env bun

/**
Render the JSON check report as markdown (stdin → stdout).

Usage:
  ConvertTo-Json $report -Depth 12 | bun packages/monorepo-tools/src/cli/render-check-report.cli.ts

Reads the report JSON from stdin, renders via @ethang/markdown-generator.
Exit codes: 0 success, 1 invalid/empty stdin, 2 render failure.
*/

import { generateMarkdown } from "@ethang/markdown-generator";
import { Effect } from "effect";
import isEmpty from "lodash/isEmpty.js";
import trim from "lodash/trim.js";
import process from "node:process";

import { renderReport } from "../application/render-report.ts";

const EXIT_STDIN_ERR = 1;

export const readStdinText = async (stdin: AsyncIterable<unknown>) => {
  const chunks: string[] = [];
  for await (const chunk of stdin) {
    chunks.push(String(chunk));
  }
  return chunks.join("");
};

export const renderFromStdin = async (stdin: AsyncIterable<unknown>) => {
  const raw = trim(await readStdinText(stdin));

  if (isEmpty(raw)) {
    process.stderr.write("render-check-report: empty stdin\n");
    process.exit(EXIT_STDIN_ERR);
  }

  const { blocks } = await Effect.runPromise(renderReport({ reportText: raw }));

  const rendered = generateMarkdown({ blocks });
  process.stdout.write(rendered);
};

/* v8 ignore next 3 -- import.meta.main is true only when Bun launches this CLI. */
if (import.meta.main) {
  await renderFromStdin(process.stdin);
}
