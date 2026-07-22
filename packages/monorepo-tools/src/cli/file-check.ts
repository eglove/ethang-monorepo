import { Command } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Effect, Schema } from "effect";
import forEach from "lodash/forEach.js";
import trim from "lodash/trim.js";

import { runEslint } from "./run-eslint.ts";
import { runWebstormInspections } from "./run-webstorm-inspections.ts";

// Matches Hermes transform_tool_result wire protocol:
// { tool_name, tool_input, cwd, extra: { result, task_id, tool_call_id } }
// `extra` and its fields are optional — hermes hooks test may not include them
const OptionalString = Schema.optional(Schema.String);

export const HermesHookInput = Schema.Struct({
  extra: Schema.optional(
    Schema.Struct({
      result: Schema.String,
      task_id: OptionalString
    })
  ),
  tool_input: Schema.Unknown,
  tool_name: Schema.String
});

// Validates tool_input from unknown into a shape with optional path/target strings
const ToolInputSchema = Schema.Struct({
  path: Schema.optional(Schema.String),
  target: Schema.optional(Schema.String)
});

const readStdin = Effect.async<string, Error>((resume) => {
  // v8 ignore start - stdin infrastructure, tested via hook integration only
  if (process.stdin.isTTY) {
    resume(Effect.succeed(""));
    return;
  }

  let data = "";
  process.stdin.setEncoding("utf8");

  const onData = (chunk: string) => {
    data += chunk;
  };

  const onEnd = () => {
    cleanup();
    resume(Effect.succeed(data));
  };

  const onError = (error: Error) => {
    cleanup();
    resume(Effect.fail(error));
  };

  const cleanup = () => {
    process.stdin.off("data", onData);
    process.stdin.off("end", onEnd);
    process.stdin.off("error", onError);
    process.stdin.pause();
  };

  process.stdin.on("data", onData);
  process.stdin.on("end", onEnd);
  process.stdin.on("error", onError);
  process.stdin.resume();
  // v8 ignore end
});

const runOnTools = new Set(["patch", "write_file"]);

export const extractTargetPath = (toolInput: unknown) => {
  const parsed = Schema.decodeUnknownEither(ToolInputSchema)(toolInput);
  if ("Left" === parsed._tag) return ".";
  const pathString = parsed.right.path ?? null;
  const targetString = parsed.right.target ?? null;
  return pathString ?? targetString ?? ".";
};

export const collectDiagnostics = (fixedFiles: string[], errors: string[]) => {
  const diagnostics: string[] = [];
  forEach(fixedFiles, (fixedFile) => {
    diagnostics.push(fixedFile);
  });
  forEach(errors, (error) => {
    diagnostics.push(error);
  });
  return diagnostics;
};

export const buildOutput = (result: string, diagnostics: string[]) => {
  const appendedContext = diagnostics.length
    ? `\n\n[hook:eslint-autofix+webstorm] ${diagnostics.join("\n")}`
    : "";
  return JSON.stringify({ result: result + appendedContext });
};

export const runInspections = (targetPath: string) => {
  return Effect.gen(function* () {
    const fixedFiles = yield* runEslint([targetPath]);
    const errors = yield* runWebstormInspections([targetPath]);
    return collectDiagnostics(fixedFiles, errors);
  });
};

export const mainCommand = Command.make("repo-check", {}, () => {
  // v8 ignore start - CLI entry point, tested via integration/hook test
  return Effect.gen(function* () {
    const rawInput = yield* readStdin;

    if (!trim(rawInput)) {
      yield* Effect.logInfo("No STDIN payload provided.");
      return;
    }

    const input = Schema.decodeUnknownEither(Schema.parseJson(HermesHookInput))(
      rawInput
    );

    if ("Left" === input._tag) {
      yield* Effect.logError("Invalid Hermes STDIN payload:", input.left);
      return;
    }

    const { extra, tool_input: toolArguments, tool_name } = input.right;
    const result = extra?.result ?? "";

    if (!runOnTools.has(tool_name)) {
      if (!result) return;
      globalThis.console.log(JSON.stringify({ result }));
      return;
    }

    const targetPath = extractTargetPath(toolArguments);
    const diagnostics = yield* runInspections(targetPath);
    globalThis.console.log(buildOutput(result, diagnostics));
    globalThis.process.exit(0);
  });
  // v8 ignore end
});

// v8 ignore start - CLI bootstrap, executed at module load time
const run = Command.run(mainCommand, {
  name: "repo-check",
  version: "0.0.0"
});

// Force exit after completion — MCP connections keep the event loop alive
NodeRuntime.runMain(run(process.argv).pipe(Effect.provide(NodeContext.layer)));
// v8 ignore end
