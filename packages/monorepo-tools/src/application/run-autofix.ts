/**
Orchestrate a two-pass ESLint fix on a set of files and produce
autofix summary data consumable by the parent PowerShell check
script.

This loads ESLint,
run with `fix: true`, call `outputFixes`, then run again to capture
the post-fix message set. The result gets fed into
`summarizeAutofix` for rule-level and file-level aggregation.
*/

import { Effect } from "effect";

import {
  loadAutofixResults,
  type LoadAutofixResultsOptions
} from "../infrastructure/eslint-loader.ts";

class RunAutofixError extends Error {
  public override readonly name = "RunAutofixError";
}

const runLoad = (options: LoadAutofixResultsOptions) => {
  return loadAutofixResults(options).pipe(
    Effect.mapError((cause) => {
      return new RunAutofixError(
        `run-autofix: load failed for ${options.cwd}: ${String(cause)}`
      );
    })
  );
};

export const runAutofix = (options: LoadAutofixResultsOptions) => {
  return Effect.gen(function* () {
    return yield* runLoad(options);
  });
};
