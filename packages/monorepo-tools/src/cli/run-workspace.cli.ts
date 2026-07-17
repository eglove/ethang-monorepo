#!/usr/bin/env bun

/** Run ESLint, TypeScript, and Vitest for one workspace. */

import { Duration, Effect, Either, Schema } from "effect";
import every from "lodash/every.js";
import filter from "lodash/filter.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import lastIndexOf from "lodash/lastIndexOf.js";
import map from "lodash/map.js";
import reduce from "lodash/reduce.js";
import reject from "lodash/reject.js";
import split from "lodash/split.js";
import trim from "lodash/trim.js";
import uniq from "lodash/uniq.js";
import { execFile } from "node:child_process";
import process from "node:process";

import { runAutofix } from "../application/run-autofix.ts";
import {
  type AutofixPayload,
  summarizeAutofix
} from "../domain/eslint-autofix.ts";

const EXIT_FAIL = 1;
const EMPTY_FILES = ["."];
const CHECK_LINT = "lint" as const;
const CHECK_TSC = "tsc" as const;
const CHECK_TEST = "test" as const;
const ALL_CHECKS = [CHECK_LINT, CHECK_TSC, CHECK_TEST] as const;

const CliCheckSchema = Schema.Literal(...ALL_CHECKS);
const CliChecksSchema = Schema.Array(CliCheckSchema);
const JsonStringArraySchema = Schema.parseJson(Schema.Array(Schema.String));

type CliCheck = (typeof ALL_CHECKS)[number];
type TscDiagnostic = Schema.Schema.Type<typeof TscDiagnosticSchema>;

export const packageManagerExecutable = (platform: string) => {
  return "win32" === platform ? "pnpm.cmd" : "pnpm";
};

const VitestAssertionSchema = Schema.Struct({
  ancestorTitles: Schema.optional(Schema.Array(Schema.String)),
  duration: Schema.optional(Schema.Number),
  failureMessages: Schema.optional(Schema.Array(Schema.String)),
  status: Schema.String,
  title: Schema.String
});

const VitestFileSchema = Schema.Struct({
  assertionResults: Schema.optional(Schema.Array(VitestAssertionSchema)),
  name: Schema.String
});

const VitestDocumentSchema = Schema.Struct({
  numFailedTests: Schema.optional(Schema.Number),
  numPassedTests: Schema.optional(Schema.Number),
  numSkippedTests: Schema.optional(Schema.Number),
  numTodoTests: Schema.optional(Schema.Number),
  numTotalTests: Schema.optional(Schema.Number),
  success: Schema.optional(Schema.Boolean),
  testResults: Schema.optional(Schema.Array(VitestFileSchema))
});

const decodeVitest = Schema.decodeUnknownEither(
  Schema.parseJson(VitestDocumentSchema)
);

const TscDiagnosticSchema = Schema.Struct({
  code: Schema.String,
  column: Schema.NumberFromString,
  file: Schema.String,
  line: Schema.NumberFromString,
  message: Schema.String,
  severity: Schema.Literal("error", "info", "warning")
});

const decodeTscDiagnostic = Schema.decodeUnknownEither(TscDiagnosticSchema);

export type Command = {
  readonly arguments: readonly string[];
  readonly cwd: string;
};

export type CommandResult = {
  readonly exitCode: number;
  readonly stderr: string;
  readonly stdout: string;
};

export type ParsedArguments = {
  readonly checks: readonly CliCheck[];
  readonly cwd: string;
  readonly files: readonly string[];
  readonly fix: boolean;
  readonly targetedFiles: readonly string[];
  readonly testFiles: readonly string[];
};

export type WorkspaceRunner = {
  readonly run: (command: Command) => Effect.Effect<CommandResult, unknown>;
};

type Accumulator = {
  readonly checks: readonly CliCheck[];
  readonly cwd: null | string;
  readonly files: null | string;
  readonly fix: boolean;
  readonly targetedFiles: null | string;
  readonly testFiles: null | string;
};

const fail = (message: string) => {
  process.stderr.write(`run-workspace: ${message}\n`);
  return process.exit(EXIT_FAIL);
};

const decodeJsonStringArray = (value: string) => {
  return Schema.decodeUnknownSync(JsonStringArraySchema)(value, {
    errors: "all"
  });
};

const shiftNext = (tail: readonly string[]) => {
  const [next, ...rest] = tail;
  const value = next ?? fail("Missing value after flag");
  return { rest, value };
};

const dedupeChecks = (checks: readonly CliCheck[]) => {
  return uniq(checks);
};

const decodeChecks = (value: string) => {
  return Schema.decodeUnknownSync(CliChecksSchema)(
    split(value, ",").flatMap((entry) => {
      return isEmpty(trim(entry)) ? [] : [trim(entry)];
    })
  );
};

const updateChecks = (
  accumulator: Accumulator,
  nextChecks: readonly CliCheck[]
) => {
  return { ...accumulator, checks: nextChecks };
};

const removeCheck = (checks: readonly CliCheck[], check: CliCheck) => {
  return filter(checks, (entry) => {
    return entry !== check;
  });
};

const includeCheck = (checks: readonly CliCheck[], check: CliCheck) => {
  return dedupeChecks([...checks, check]);
};

const skipChecks = (checks: readonly CliCheck[], value: string) => {
  const skippedChecks = decodeChecks(value);
  return reject(checks, (check) => {
    return skippedChecks.includes(check);
  });
};

const writeUsageAndExit = () => {
  process.stdout.write(
    "Usage: bun run-workspace.cli.ts --cwd <dir> [--fix] [--files <json>] [--test-files <json>] [--targeted-files <json>] [--checks <lint,tsc,test>] [--skip-checks <lint,tsc,test>] [--no-lint] [--no-tsc] [--no-test] [--lint] [--tsc] [--test]\n"
  );
  process.exit(0);
};

type ArgumentHandler = (
  tail: readonly string[],
  accumulator: Accumulator
) => Accumulator;

const withShiftedValue = (
  tail: readonly string[],
  apply: (rest: readonly string[], value: string) => Accumulator
) => {
  const { rest, value } = shiftNext(tail);
  return apply(rest, value);
};

const nextChecks = (accumulator: Accumulator, value: string) => {
  return updateChecks(accumulator, dedupeChecks(decodeChecks(value)));
};

const argumentHandlers: Record<string, ArgumentHandler> = {
  "--checks": (tail, accumulator) => {
    return withShiftedValue(tail, (rest, value) => {
      return shiftArguments(rest, nextChecks(accumulator, value));
    });
  },
  "--cwd": (tail, accumulator) => {
    return withShiftedValue(tail, (rest, value) => {
      return shiftArguments(rest, { ...accumulator, cwd: value });
    });
  },
  "--files": (tail, accumulator) => {
    return withShiftedValue(tail, (rest, value) => {
      return shiftArguments(rest, { ...accumulator, files: value });
    });
  },
  "--fix": (tail, accumulator) => {
    return shiftArguments(tail, { ...accumulator, fix: true });
  },
  "--lint": (tail, accumulator) => {
    return shiftArguments(
      tail,
      updateChecks(accumulator, includeCheck(accumulator.checks, CHECK_LINT))
    );
  },
  "--no-lint": (tail, accumulator) => {
    return shiftArguments(
      tail,
      updateChecks(accumulator, removeCheck(accumulator.checks, CHECK_LINT))
    );
  },
  "--no-test": (tail, accumulator) => {
    return shiftArguments(
      tail,
      updateChecks(accumulator, removeCheck(accumulator.checks, CHECK_TEST))
    );
  },
  "--no-tsc": (tail, accumulator) => {
    return shiftArguments(
      tail,
      updateChecks(accumulator, removeCheck(accumulator.checks, CHECK_TSC))
    );
  },
  "--skip-checks": (tail, accumulator) => {
    return withShiftedValue(tail, (rest, value) => {
      return shiftArguments(
        rest,
        updateChecks(accumulator, skipChecks(accumulator.checks, value))
      );
    });
  },
  "--targeted-files": (tail, accumulator) => {
    return withShiftedValue(tail, (rest, value) => {
      return shiftArguments(rest, { ...accumulator, targetedFiles: value });
    });
  },
  "--test": (tail, accumulator) => {
    return shiftArguments(
      tail,
      updateChecks(accumulator, includeCheck(accumulator.checks, CHECK_TEST))
    );
  },
  "--test-files": (tail, accumulator) => {
    return withShiftedValue(tail, (rest, value) => {
      return shiftArguments(rest, { ...accumulator, testFiles: value });
    });
  },
  "--tsc": (tail, accumulator) => {
    return shiftArguments(
      tail,
      updateChecks(accumulator, includeCheck(accumulator.checks, CHECK_TSC))
    );
  }
};

const shiftArguments = (
  remaining: readonly string[],
  accumulator: Accumulator
) => {
  const [head, ...tail] = remaining;
  if (isNil(head) || isEmpty(head)) {
    return accumulator;
  }
  if ("--help" === head || "-h" === head) {
    writeUsageAndExit();
    return accumulator;
  }
  const handler = argumentHandlers[head];
  return isNil(handler)
    ? fail(`Unknown argument: ${head}`)
    : handler(tail, accumulator);
};

const parseFiles = (value: null | string) => {
  return isNil(value) ? [] : decodeJsonStringArray(value);
};

export const parseArguments = (argv: readonly string[]) => {
  const accumulator = shiftArguments(argv, {
    checks: ALL_CHECKS,
    cwd: null,
    files: null,
    fix: false,
    targetedFiles: null,
    testFiles: null
  });
  const requiredCwd = accumulator.cwd ?? fail("Missing --cwd <directory>");
  return {
    checks: accumulator.checks,
    cwd: requiredCwd,
    files: parseFiles(accumulator.files),
    fix: accumulator.fix,
    targetedFiles: parseFiles(accumulator.targetedFiles),
    testFiles: parseFiles(accumulator.testFiles)
  };
};

const withDuration = <T extends object>(effect: Effect.Effect<T, unknown>) => {
  return Effect.timed(effect).pipe(
    Effect.map(([duration, result]) => {
      return { ...result, durationMs: Duration.toMillis(duration) };
    })
  );
};

const runSubprocess = Effect.fn("run-workspace.subprocess")(function* (
  command: Command
) {
  return yield* Effect.tryPromise({
    catch: (cause) => {
      return cause;
    },
    try: async () => {
      return new Promise<CommandResult>((resolve) => {
        execFile(
          packageManagerExecutable(process.platform),
          command.arguments,
          { cwd: command.cwd, encoding: "utf8" },
          (error, stdout, stderr) => {
            resolve({
              exitCode: isNil(error) ? 0 : 1,
              stderr,
              stdout
            });
          }
        );
      });
    }
  });
});

const defaultRunner: WorkspaceRunner = { run: runSubprocess };

const diagnosticFrom = (line: string) => {
  const [location, severityAndCode, ...messageParts] = split(line, ": ");
  if (isNil(location) || isNil(severityAndCode) || isEmpty(messageParts)) {
    return null;
  }
  const message = messageParts.join("): ");
  const locationStart = lastIndexOf(location, "(");
  const locationEnd = lastIndexOf(location, ")");
  const [lineNumber, column] = split(
    location.slice(locationStart + 1, locationEnd),
    ","
  );
  const [severity, code] = split(severityAndCode, " ");
  const decoded = decodeTscDiagnostic({
    code,
    column,
    file: location.slice(0, locationStart),
    line: lineNumber,
    message,
    severity
  });
  return Either.isRight(decoded) ? decoded.right : null;
};

const diagnosticsFrom = (output: string) => {
  return split(output, /\r?\n/u).flatMap((line) => {
    const diagnostic = diagnosticFrom(line);
    return isNil(diagnostic) ? [] : [diagnostic];
  });
};

const scopedDiagnosticFile = (diagnostic: TscDiagnostic) => {
  return diagnostic.file;
};

const isScopedDiagnostic = (
  diagnostic: TscDiagnostic,
  targetedFiles: readonly string[]
) => {
  if (isEmpty(targetedFiles)) {
    return true;
  }
  return targetedFiles.includes(scopedDiagnosticFile(diagnostic));
};

export const toTscResult = (
  command: CommandResult,
  targetedFiles: readonly string[] = []
) => {
  const diagnostics = diagnosticsFrom(`${command.stdout}\n${command.stderr}`);
  const errorCount = filter(diagnostics, ({ severity }) => {
    return "error" === severity;
  }).length;
  const warningCount = filter(diagnostics, ({ severity }) => {
    return "warning" === severity;
  }).length;
  const filteredDiagnostics = filter(diagnostics, (diagnostic) => {
    return isScopedDiagnostic(diagnostic, targetedFiles);
  });
  return {
    diagnostics: isEmpty(targetedFiles) ? diagnostics : filteredDiagnostics,
    errorCount,
    exitCode: command.exitCode,
    passed: 0 === command.exitCode && 0 === errorCount,
    ran: true,
    scopedDiagnostics: !isEmpty(targetedFiles),
    warningCount
  };
};

const vitestDocument = (text: string) => {
  const decoded = decodeVitest(text);
  return Either.isRight(decoded) ? decoded.right : null;
};

const vitestDocuments = (stdout: string) => {
  const whole = vitestDocument(stdout);
  if (!isNil(whole)) {
    return [whole];
  }
  return split(stdout, /\r?\n/u).flatMap((line) => {
    const document = vitestDocument(line);
    return isNil(document) ? [] : [document];
  });
};

export const toVitestResult = (
  command: CommandResult,
  testFiles: readonly string[] = [],
  isRanFullWorkspace = true
) => {
  const documents = vitestDocuments(command.stdout);
  const failingTests = documents.flatMap((document) => {
    return (document.testResults ?? []).flatMap((file) => {
      return (file.assertionResults ?? []).flatMap((assertion) => {
        if ("failed" !== assertion.status) {
          return [];
        }
        return [
          {
            durationMs: assertion.duration ?? 0,
            failureMessages: assertion.failureMessages ?? [],
            file: file.name,
            name: [...(assertion.ancestorTitles ?? []), assertion.title].join(
              " > "
            )
          }
        ];
      });
    });
  });
  const totals = reduce(
    documents,
    (current, document) => {
      return {
        failed: current.failed + (document.numFailedTests ?? 0),
        passed: current.passed + (document.numPassedTests ?? 0),
        skipped: current.skipped + (document.numSkippedTests ?? 0),
        todo: current.todo + (document.numTodoTests ?? 0),
        total: current.total + (document.numTotalTests ?? 0)
      };
    },
    { failed: 0, passed: 0, skipped: 0, todo: 0, total: 0 }
  );
  const isSuccess = every(documents, (document) => {
    return false !== document.success;
  });
  const isParsed = 0 < documents.length;
  const isFailedWithoutJson = !isParsed && 0 !== command.exitCode;
  return {
    exitCode: command.exitCode,
    failingTests: isFailedWithoutJson
      ? [
          {
            durationMs: 0,
            failureMessages: [command.stderr],
            file: null,
            name: "vitest did not produce JSON output"
          }
        ]
      : failingTests,
    parseError: isParsed ? null : "Vitest did not produce a JSON report",
    passed: 0 === command.exitCode && isSuccess && 0 === totals.failed,
    ran: true,
    ranFullWorkspace: isRanFullWorkspace,
    scopedToTestFiles: testFiles,
    totals: {
      ...totals,
      failed: isFailedWithoutJson ? 1 : totals.failed
    }
  };
};

const toLintResult = (
  payload: AutofixPayload,
  isFix: boolean,
  exitCode: number
) => {
  const issues = payload.results.flatMap((entry) => {
    return map(entry.postFixMessages, (message) => {
      return { file: entry.filePath, ...message };
    });
  });
  const errorCount = filter(issues, ({ severity }) => {
    return 2 === severity;
  }).length;
  const warningCount = filter(issues, ({ severity }) => {
    return 1 === severity;
  }).length;
  const fixableErrorCount = filter(issues, ({ fixable, severity }) => {
    return fixable && 2 === severity;
  }).length;
  const fixableWarningCount = filter(issues, ({ fixable, severity }) => {
    return fixable && 1 === severity;
  }).length;
  return {
    autofix: isFix ? summarizeAutofix(payload) : null,
    errorCount,
    exitCode,
    fixableErrorCount,
    fixableWarningCount,
    issues,
    passed: 0 === errorCount,
    ran: true,
    warningCount
  };
};

const failedLint = (cause: unknown) => {
  return {
    autofix: null,
    errorCount: 1,
    exitCode: 1,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
    issues: [
      {
        column: 0,
        file: null,
        fixable: false,
        line: 0,
        message: String(cause),
        ruleId: null,
        severity: 2
      }
    ],
    passed: false,
    ran: true,
    warningCount: 0
  };
};

const toDisabledLintResult = () => {
  return {
    autofix: null,
    durationMs: 0,
    errorCount: 0,
    exitCode: -1,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
    issues: [],
    passed: true,
    ran: false,
    warningCount: 0
  };
};

const toDisabledTscResult = () => {
  return {
    diagnostics: [],
    durationMs: 0,
    errorCount: 0,
    exitCode: -1,
    passed: true,
    ran: false,
    scopedDiagnostics: false,
    warningCount: 0
  };
};

const toDisabledVitestResult = () => {
  return {
    durationMs: 0,
    exitCode: -1,
    failingTests: [],
    parseError: null,
    passed: true,
    ran: false,
    ranFullWorkspace: false,
    scopedToTestFiles: [],
    totals: { failed: 0, passed: 0, skipped: 0, todo: 0, total: 0 }
  };
};

const runLint = Effect.fn("run-workspace.lint")(function* (
  cwd: string,
  files: readonly string[],
  isFix: boolean
) {
  return yield* withDuration(
    runAutofix({
      cwd,
      files: isEmpty(files) ? EMPTY_FILES : files,
      fix: isFix
    }).pipe(
      Effect.map((payload) => {
        return toLintResult(payload, isFix, 0);
      }),
      Effect.catchAll((cause) => {
        return Effect.succeed(failedLint(cause));
      })
    )
  );
});

const runTsc = Effect.fn("run-workspace.tsc")(function* (
  cwd: string,
  runner: WorkspaceRunner,
  targetedFiles: readonly string[]
) {
  return yield* withDuration(
    Effect.map(
      runner.run({
        arguments: ["exec", "tsc", "--noEmit", "--pretty", "false"],
        cwd
      }),
      (command) => {
        return toTscResult(command, targetedFiles);
      }
    )
  );
});

const vitestArguments = (testFiles: readonly string[]) => {
  return isEmpty(testFiles)
    ? ["exec", "vitest", "run", "--reporter=json", "--coverage=false"]
    : [
        "exec",
        "vitest",
        "run",
        "--reporter=json",
        "--coverage=false",
        ...testFiles
      ];
};

const testResultFrom = (
  command: CommandResult,
  testFiles: readonly string[]
) => {
  return toVitestResult(command, testFiles, isEmpty(testFiles));
};

const runTest = Effect.fn("run-workspace.test")(function* (
  cwd: string,
  runner: WorkspaceRunner,
  testFiles: readonly string[]
) {
  const commandEffect = runner.run({
    arguments: vitestArguments(testFiles),
    cwd
  });
  return yield* withDuration(
    Effect.map(commandEffect, (command) => {
      return testResultFrom(command, testFiles);
    })
  );
});

const shouldRunCheck = (checks: readonly CliCheck[], check: CliCheck) => {
  return checks.includes(check);
};

export const runWorkspace = Effect.fn("run-workspace")(function* (
  options: ParsedArguments,
  runner: WorkspaceRunner = defaultRunner
) {
  const checks = yield* Effect.all([
    shouldRunCheck(options.checks, CHECK_LINT)
      ? runLint(options.cwd, options.files, options.fix)
      : Effect.succeed(toDisabledLintResult()),
    shouldRunCheck(options.checks, CHECK_TSC)
      ? runTsc(options.cwd, runner, options.targetedFiles)
      : Effect.succeed(toDisabledTscResult()),
    shouldRunCheck(options.checks, CHECK_TEST)
      ? runTest(options.cwd, runner, options.testFiles)
      : Effect.succeed(toDisabledVitestResult())
  ]);
  return {
    checks: options.checks,
    cwd: options.cwd,
    files: options.files,
    lint: checks[0],
    targetedFiles: options.targetedFiles,
    test: checks[2],
    testFiles: options.testFiles,
    tsc: checks[1]
  };
});

export const main = async (argv: readonly string[]) => {
  const result = await Effect.runPromise(runWorkspace(parseArguments(argv)));
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (
    [result.lint.passed, result.test.passed, result.tsc.passed].includes(false)
  ) {
    process.exit(EXIT_FAIL);
  }
};

export const runMainFromProcess = async (
  argv: readonly string[] = process.argv.slice(2)
) => {
  return main(argv);
};

/* v8 ignore next 3 -- import.meta.main is true only when Bun launches this CLI. */
if (import.meta.main) {
  await runMainFromProcess();
}
