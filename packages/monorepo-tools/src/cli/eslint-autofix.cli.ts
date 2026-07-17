#!/usr/bin/env bun

/**
ESLint autofix telemetry entry point for the monorepo checker.
*/

import { Effect, Schema } from "effect";
import process from "node:process";

import { loadAutofixResults } from "../infrastructure/eslint-loader.ts";

const ArgumentsSchema = Schema.Struct({
  cwd: Schema.String,
  files: Schema.Array(Schema.String)
});

const FilesSchema = Schema.Array(Schema.String);

const EXIT_FAIL = 1;

const fail = (message: string) => {
  process.stderr.write(`eslint-autofix: ${message}\n`);
  return process.exit(EXIT_FAIL);
};

const parseCwd = (argv: readonly string[], startIndex: number) => {
  return argv[startIndex + 1] ?? null;
};

const parseFiles = (argv: readonly string[], startIndex: number) => {
  return argv[startIndex + 1] ?? null;
};

export const parseArguments = (argv: readonly string[]) => {
  let cwdValue: null | string = null;
  let filesValue: null | string = null;

  for (let index = 0; index < argv.length; index += 1) {
    const a = argv[index];
    if ("--help" === a || "-h" === a) {
      process.stdout.write(
        "Usage: bun eslint-autofix.cli.ts --cwd <dir> --files <json-array>\n"
      );
      process.exit(0);
    }
    if ("--cwd" === a) {
      cwdValue = parseCwd(argv, index);
      index += 1;
    } else if ("--files" === a) {
      filesValue = parseFiles(argv, index);
      index += 1;
    } else {
      fail(`Unknown argument: ${a}`);
    }
  }

  const requiredCwd = cwdValue ?? fail("Missing --cwd <directory>");
  const requiredFiles = filesValue ?? fail("Missing --files <json-array>");
  const files = Schema.decodeUnknownSync(Schema.parseJson(FilesSchema))(
    requiredFiles
  );
  return Schema.decodeUnknownSync(ArgumentsSchema)({
    cwd: requiredCwd,
    files
  });
};

export const main = async (argv: readonly string[]) => {
  const { cwd, files } = parseArguments(argv);
  const result = await Effect.runPromise(loadAutofixResults({ cwd, files }));
  process.stdout.write(`${JSON.stringify(result)}\n`);
};

/* v8 ignore next 3 -- import.meta.main is true only when Bun launches this CLI. */
if (import.meta.main) {
  await main(process.argv.slice(2));
}
