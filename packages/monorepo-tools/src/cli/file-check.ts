import { Command, Options } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Effect, Schema } from "effect";
import forEach from "lodash/forEach.js";
import isString from "lodash/isString.js";
import trim from "lodash/trim.js";

import { runEslint } from "./run-eslint.ts";
import { runWebstormInspections } from "./run-webstorm-inspections.ts";

export const HermesHookInput = Schema.Struct({
  arguments: Schema.Record({
    key: Schema.String,
    value: Schema.Unknown
  }),
  result: Schema.String,
  task_id: Schema.NullOr(Schema.String),
  tool_name: Schema.String
});

const targetOption = Options.text("target").pipe(
  Options.withAlias("f"),
  Options.withDescription("Target file, directory, or glob pattern to lint"),
  Options.withDefault(".")
);

const readStdin = Effect.async<string, Error>((resume) => {
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
});

const runOnTools = new Set(["patch", "write_file"]);

const mainCommand = Command.make("repo-check", { target: targetOption }, () => {
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

    const { arguments: toolArguments, result, tool_name } = input.right;

    if (!runOnTools.has(tool_name)) {
      globalThis.console.log(result);
      return;
    }

    const pathString = isString(toolArguments["path"])
      ? toolArguments["path"]
      : null;
    const targetString = isString(toolArguments["target"])
      ? toolArguments["target"]
      : null;
    const targetPath = pathString ?? targetString ?? ".";

    const fixedFiles = yield* runEslint([targetPath]);
    const errors = yield* runWebstormInspections([targetPath]);

    let appendedContext = "";

    forEach(fixedFiles, (fixedFile) => {
      appendedContext += `\n${fixedFile}`;
    });

    forEach(errors, (error) => {
      appendedContext += `\n${error}`;
    });

    globalThis.console.log(result + appendedContext);
  });
});

const run = Command.run(mainCommand, {
  name: "repo-check",
  version: "0.0.0"
});

NodeRuntime.runMain(run(process.argv).pipe(Effect.provide(NodeContext.layer)));
