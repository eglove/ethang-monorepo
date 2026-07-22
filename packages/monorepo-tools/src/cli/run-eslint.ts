import { Data, Effect } from "effect";
import { ESLint } from "eslint";
import filter from "lodash/filter.js";
import isNil from "lodash/isNil.js";

export class ESLintExecutionError extends Data.TaggedError(
  "ESLintExecutionError"
)<{
  readonly cause: unknown;
}> {}

export function* runEslint(targets: string[]) {
  yield* Effect.log(`🔍 Linting Targets\`${targets.join("`, `")}\``);

  const results = yield* Effect.tryPromise({
    catch: (error) => {
      return new ESLintExecutionError({ cause: error });
    },
    try: async () => {
      const eslint = new ESLint({ concurrency: "auto", fix: true });
      const lintResults = await eslint.lintFiles(targets);
      await ESLint.outputFixes(lintResults);
      return lintResults;
    }
  });

  const fixedFiles = filter(results, (result) => {
    return !isNil(result.output);
  });
  const messages: string[] = [];

  if (0 < fixedFiles.length) {
    yield* Effect.log(`🛠️ Autofixed Files (${fixedFiles.length})`);
    for (const file of fixedFiles) {
      const message = `[FIXED]: \`${file.filePath}\``;
      messages.push(message);
      yield* Effect.log(message);
    }
  }

  return messages;
}
