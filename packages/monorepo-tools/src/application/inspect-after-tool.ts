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
  readonly filePath: string;
  readonly cwd: string;
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

  // Build file info directly from filePath and cwd
  const repoRoot = options.cwd;
  const normalizedPath = options.filePath.startsWith(repoRoot)
    ? options.filePath
    : `${repoRoot}/${options.filePath}`;
  const relFilePath = options.filePath.startsWith(repoRoot)
    ? options.filePath.slice(repoRoot.length + 1)
    : options.filePath;

  yield* dependencies
    .applyEslintFix({ cwd: repoRoot, files: [normalizedPath] })
    .pipe(
      Effect.catchAllCause(() => {
        return Effect.void;
      })
    );
  const problems = yield* dependencies
    .loadFileProblems({
      filePath: relFilePath,
      projectPath: repoRoot
    })
    .pipe(
      Effect.catchAllCause(() => {
        return Effect.succeed(null);
      })
    );
  const additionalContext = isNil(problems)
    ? ""
    : (formatInspectionsAsMarkdown(relFilePath, problems.errors) ?? "");

  return {
    hookSpecificOutput: {
      additionalContext,
      hookEventName: "PostToolUse",
      resultsFile: null
    }
  };
});
