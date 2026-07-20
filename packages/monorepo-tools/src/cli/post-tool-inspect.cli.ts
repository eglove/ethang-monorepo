#!/usr/bin/env bun

/**
transform_tool_result hook: read Hermes JSON from stdin, apply ESLint --fix,
call WebStorm MCP get_file_problems, emit a JSON envelope on stdout.

stdin (transform_tool_result payload from Hermes):
  Built-in tools (patch, write_file):
    tool_name: "patch" | "write_file"
    tool_input: {"path": "rel/path.ts", ...}
    cwd: "/abs/path/to/repo"

  WebStorm MCP tools (create_new_file, rename_refactoring, reformat_file):
    tool_name: "mcp__webstorm__*"
    tool_input: {"pathInProject": "rel/path.ts", "projectPath": "/abs/path", ...}
    cwd: "/abs/path/to/repo"

  extra: {"result": "<original tool return string>", ...}

stdout:
  {"result": "<original>\n\n<diagnostics markdown>"}   when issues are found
  {}                                                   when clean (pass through)
*/

import { Effect, Either, Schema } from "effect";
import constant from "lodash/constant.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import process from "node:process";

import { inspectAfterTool } from "../application/inspect-after-tool.ts";

const ToolInputSchema = Schema.Struct({
  path: Schema.optional(Schema.String),
  pathInProject: Schema.optional(Schema.String)
});
const ExtraSchema = Schema.Struct({ result: Schema.optional(Schema.String) });

const PayloadStructSchema = Schema.Struct({
  cwd: Schema.optional(Schema.String),
  extra: Schema.optional(ExtraSchema),
  tool_input: Schema.optional(ToolInputSchema)
});

const PayloadJsonSchema = Schema.parseJson(PayloadStructSchema);
const decodePayloadRaw = Schema.decodeUnknownEither(PayloadJsonSchema);

export type HermesTransformPayload = Schema.Schema.Type<
  typeof PayloadStructSchema
>;

const EMPTY_JSON = "{}\n";
const SEPARATOR = "\n\n";

const tryDecodePayload = (raw: string) => {
  const decoded = decodePayloadRaw(raw);
  if (Either.isRight(decoded)) {
    return decoded.right;
  }
  return null;
};

const collectChunks = async (stdin: AsyncIterable<unknown>) => {
  const chunks: string[] = [];
  for await (const chunk of stdin) {
    chunks.push(String(chunk));
  }
  return chunks.join("");
};

export const readStdinText = collectChunks;

export const buildTransformedResult = (
  originalResult: string,
  diagnostics: string
) => {
  if (isEmpty(diagnostics)) {
    return originalResult;
  }
  return `${originalResult}${SEPARATOR}${diagnostics}`;
};

const writeEmpty = () => {
  process.stdout.write(EMPTY_JSON);
};

const writeResult = (combined: string) => {
  process.stdout.write(`${JSON.stringify({ result: combined })}\n`);
};

export const extractFields = (parsed: HermesTransformPayload) => {
  const toolPath =
    parsed.tool_input?.path ?? parsed.tool_input?.pathInProject ?? null;
  return {
    cwd: parsed.cwd ?? null,
    filePath: toolPath,
    originalResult: parsed.extra?.result ?? ""
  };
};

const isBlankString = (value: null | string) => {
  return !isString(value) || isEmpty(value);
};

export const main = async (stdin: AsyncIterable<unknown>) => {
  const stdinPayload = await readStdinText(stdin);
  const parsed = tryDecodePayload(stdinPayload);

  if (isNil(parsed)) {
    writeEmpty();
    return;
  }

  const { cwd, filePath, originalResult } = extractFields(parsed);

  if (isBlankString(filePath) || isBlankString(cwd)) {
    writeEmpty();
    return;
  }

  const diagnostics = await Effect.runPromise(
    inspectAfterTool({ cwd, filePath })
  ).catch(constant(""));

  if (isEmpty(diagnostics)) {
    writeEmpty();
    return;
  }

  writeResult(buildTransformedResult(originalResult, diagnostics));
};

/* v8 ignore next 3 -- import.meta.main is true only when Bun launches this CLI. */
if (import.meta.main) {
  await main(process.stdin);
}
