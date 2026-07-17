/**
Orchestrate post-tool inspection: parse PostToolUse payload from stdin,
apply ESLint fix to the file, call the WebStorm MCP to fetch diagnostics,
and return the hook envelope JSON.

The hook handler in `.github/hooks/post-tool-inspect.json` invokes
this via `src/cli/post-tool-inspect.cli.ts`. The result is a JSON object with
`hookSpecificOutput.additionalContext` for Copilot's next turn.
*/

import { Effect } from "effect";
import isNil from "lodash/isNil.js";
import process from "node:process";

import { formatInspectionsAsMarkdown } from "../domain/mcp-protocol.ts";
import { parsePostToolUseFile } from "../domain/stdin-payload.ts";
import {
  loadAutofixResults,
  type LoadAutofixResultsOptions
} from "../infrastructure/eslint-loader.ts";
import {
  loadFileProblems,
  type LoadFileProblemsOptions,
  type LoadFileProblemsResult
} from "../infrastructure/mcp-client.ts";

export type InspectAfterToolDependencies = {
  readonly applyEslintFix: (
    options: LoadAutofixResultsOptions
  ) => Effect.Effect<unknown, unknown>;
  readonly fallbackCwd: string;
  readonly loadFileProblems: (
    options: LoadFileProblemsOptions
  ) => Effect.Effect<LoadFileProblemsResult, unknown>;
};

export type InspectAfterToolOptions = {
  readonly dependencies?: InspectAfterToolDependencies;
  readonly stdinPayload: string;
};

export type InspectAfterToolResult = {
  readonly hookSpecificOutput: {
    readonly additionalContext: string;
    readonly hookEventName: string;
    readonly resultsFile: null | string;
  };
};

const defaultDependencies: InspectAfterToolDependencies = {
  applyEslintFix: loadAutofixResults,
  fallbackCwd: process.cwd(),
  loadFileProblems
};

const emptyResult = () => {
  return {
    hookSpecificOutput: {
      additionalContext: "",
      hookEventName: "PostToolUse",
      resultsFile: null
    }
  };
};

export const inspectAfterTool = Effect.fn("inspectAfterTool")(function* (
  options: InspectAfterToolOptions
) {
  const dependencies = options.dependencies ?? defaultDependencies;
  const file = yield* Effect.try({
    catch: () => {
      return new Error("Unable to parse PostToolUse payload");
    },
    try: () => {
      return parsePostToolUseFile(
        options.stdinPayload,
        dependencies.fallbackCwd
      );
    }
  }).pipe(
    Effect.catchAll(() => {
      return Effect.succeed(null);
    })
  );
  if (isNil(file)) {
    return emptyResult();
  }

  yield* dependencies
    .applyEslintFix({ cwd: file.repoRoot, files: [file.absFilePath] })
    .pipe(
      Effect.catchAllCause(() => {
        return Effect.void;
      })
    );
  const problems = yield* dependencies
    .loadFileProblems({
      filePath: file.relFilePath,
      projectPath: file.repoRoot
    })
    .pipe(
      Effect.catchAllCause(() => {
        return Effect.succeed(null);
      })
    );
  const additionalContext = isNil(problems)
    ? ""
    : (formatInspectionsAsMarkdown(file.relFilePath, problems.errors) ?? "");

  return {
    hookSpecificOutput: {
      additionalContext,
      hookEventName: "PostToolUse",
      resultsFile: null
    }
  };
});
