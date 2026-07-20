/**
Post-tool inspection orchestrator: given a file path and repo cwd,
apply ESLint --fix as a side effect, call WebStorm MCP for diagnostics,
and return a markdown string describing the findings.

The Hermes shell hook in `.hermes/agent-hooks/post-tool-inspect.sh`
forwards this string to Hermes via the `transform_tool_result` event
by emitting `{"result": "<original tool output>\n\n<markdown>"}`.
*/

import { Effect } from "effect";
import isNil from "lodash/isNil.js";
import process from "node:process";

import { formatInspectionsAsMarkdown } from "../domain/mcp-protocol.ts";
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
  readonly cwd: string;
  readonly dependencies?: InspectAfterToolDependencies;
  readonly filePath: string;
};

const defaultDependencies: InspectAfterToolDependencies = {
  applyEslintFix: loadAutofixResults,
  fallbackCwd: process.cwd(),
  loadFileProblems
};

const EMPTY_DIAGNOSTICS = "";

export const inspectAfterTool = Effect.fn("inspectAfterTool")(function* (
  options: InspectAfterToolOptions
) {
  const dependencies = options.dependencies ?? defaultDependencies;

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
    .loadFileProblems({ filePath: relFilePath, projectPath: repoRoot })
    .pipe(
      Effect.catchAllCause(() => {
        return Effect.succeed(null);
      })
    );

  if (isNil(problems)) {
    return EMPTY_DIAGNOSTICS;
  }
  return (
    formatInspectionsAsMarkdown(relFilePath, problems.errors) ??
    EMPTY_DIAGNOSTICS
  );
});
