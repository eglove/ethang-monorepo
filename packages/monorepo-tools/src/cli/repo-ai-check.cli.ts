#!/usr/bin/env bun

import { Effect, Schema } from "effect";
import { formatIso, unsafeNow } from "effect/DateTime";
import compact from "lodash/compact.js";
import filter from "lodash/filter.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import reject from "lodash/reject.js";
import some from "lodash/some.js";
import split from "lodash/split.js";
import uniq from "lodash/uniq.js";
import { execFile } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { Readable } from "node:stream";

import { buildCheckReport } from "../domain/check-report.ts";
import { renderFromStdin } from "./render-check-report.cli.ts";

const DEFAULT_TIMEOUT_SECONDS = 600;
const ScriptsSchema = Schema.Record({
  key: Schema.String,
  value: Schema.String
});
const PackageJsonSchema = Schema.Struct({
  scripts: Schema.optional(ScriptsSchema)
});
const AutofixByFileSchema = Schema.Struct({
  file: Schema.String,
  fixedByRule: Schema.Record({ key: Schema.String, value: Schema.Number }),
  fixedErrorCount: Schema.Number,
  fixedWarningCount: Schema.Number,
  unfixableButFixableCount: Schema.Number
});
const AutofixSummarySchema = Schema.Struct({
  byFile: Schema.Array(AutofixByFileSchema),
  byRule: Schema.Array(
    Schema.Struct({
      fileCount: Schema.Number,
      fixedErrorCount: Schema.Number,
      fixedWarningCount: Schema.Number,
      ruleId: Schema.String
    })
  ),
  fixedErrorCount: Schema.Number,
  fixedWarningCount: Schema.Number,
  unfixableButFixableCount: Schema.Number
});
const LintSlotSchema = Schema.Struct({
  autofix: Schema.NullOr(AutofixSummarySchema),
  errorCount: Schema.Number,
  fixableErrorCount: Schema.Number,
  fixableWarningCount: Schema.Number,
  issues: Schema.Array(Schema.Unknown),
  passed: Schema.Boolean,
  ran: Schema.Boolean,
  warningCount: Schema.Number
});
const FailingTestSchema = Schema.Struct({
  durationMs: Schema.Number,
  failureMessages: Schema.Array(Schema.String),
  file: Schema.NullOr(Schema.String),
  name: Schema.String
});
const TestSlotSchema = Schema.Struct({
  failingTests: Schema.Array(FailingTestSchema),
  passed: Schema.Boolean,
  ran: Schema.Boolean
});
const TscSlotSchema = Schema.Struct({
  errorCount: Schema.Number,
  passed: Schema.Boolean,
  ran: Schema.Boolean,
  warningCount: Schema.Number
});
const RunnerResultSchema = Schema.Struct({
  lint: LintSlotSchema,
  test: TestSlotSchema,
  tsc: TscSlotSchema
});

type CheckFormat = "Json" | "Markdown";
type RunnerOutput = Schema.Schema.Type<typeof RunnerResultSchema>;
type Workspace = {
  readonly hasLint: boolean;
  readonly hasTest: boolean;
  readonly hasTsconfig: boolean;
  readonly name: string;
  readonly path: string;
  readonly relativePath: string;
  readonly type: "app" | "package";
};

const fail = (message: string) => {
  return Effect.runSync(Effect.fail(new Error(message)));
};

const positiveInteger = (value: string, flag: string) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || 1 > parsed) {
    fail(`${flag} must be a positive integer`);
  }
  return parsed;
};

const splitValues = (value: string) => {
  return reject(split(value, ","), isEmpty);
};

type ParsedArguments = {
  readonly files: readonly string[];
  readonly format: CheckFormat;
  readonly skipFix: boolean;
  readonly throttle: number;
  readonly timeoutSeconds: number;
  readonly workspaces: readonly string[];
};

const defaults: ParsedArguments = {
  files: [],
  format: "Markdown",
  skipFix: false,
  throttle: 1,
  timeoutSeconds: DEFAULT_TIMEOUT_SECONDS,
  workspaces: []
};

const valueAfter = (remaining: readonly string[], flag: string) => {
  const [, value] = remaining;
  return isNil(value) ? fail(`Missing value after ${flag}`) : value;
};

const parseFormat = (value: string) => {
  return "Json" === value || "Markdown" === value
    ? value
    : fail("--format must be Json or Markdown");
};

const parseNextArgument = (
  remaining: readonly string[],
  state: ParsedArguments
) => {
  const [argument] = remaining;
  if (isNil(argument)) {
    return state;
  }
  if ("--skip-fix" === argument) {
    return parseNextArgument(remaining.slice(1), { ...state, skipFix: true });
  }
  const isValueFlag = some(
    ["--file", "--format", "--throttle", "--timeout-seconds", "--workspace"],
    (flag) => {
      return flag === argument;
    }
  );
  if (!isValueFlag) {
    return fail(`Unknown argument: ${argument}`);
  }
  const value = valueAfter(remaining, argument);
  const rest = remaining.slice(2);
  switch (argument) {
    case "--file": {
      return parseNextArgument(rest, {
        ...state,
        files: uniq([...state.files, ...splitValues(value)])
      });
    }
    case "--format": {
      return parseNextArgument(rest, { ...state, format: parseFormat(value) });
    }
    case "--throttle": {
      return parseNextArgument(rest, {
        ...state,
        throttle: positiveInteger(value, argument)
      });
    }
    case "--timeout-seconds": {
      return parseNextArgument(rest, {
        ...state,
        timeoutSeconds: positiveInteger(value, argument)
      });
    }
    case "--workspace": {
      return parseNextArgument(rest, {
        ...state,
        workspaces: uniq([...state.workspaces, ...splitValues(value)])
      });
    }
    /* v8 ignore next 2 -- the value-flag guard exhausts every legal switch value. */
    default: {
      return fail(`Unknown argument: ${argument}`);
    }
  }
};

export const parseArguments = (argv: readonly string[]) => {
  return parseNextArgument(argv, defaults);
};

const packageJsonOf = (workspacePath: string) => {
  return Schema.decodeUnknownSync(Schema.parseJson(PackageJsonSchema))(
    readFileSync(path.join(workspacePath, "package.json"), "utf8")
  );
};

const hasFile = (directory: string, name: string) => {
  return some(readdirSync(directory, { withFileTypes: true }), (entry) => {
    return entry.isFile() && entry.name === name;
  });
};

const WORKSPACE_TYPES = {
  apps: "app",
  packages: "package"
} as const;

const workspaceType = (prefix: "apps" | "packages") => {
  return WORKSPACE_TYPES[prefix];
};

export const discoverWorkspaces = (repoRoot: string) => {
  const prefixes = ["apps", "packages"] as const;
  return prefixes.flatMap((prefix) => {
    const basePath = path.join(repoRoot, prefix);
    return readdirSync(basePath, { withFileTypes: true }).flatMap((entry) => {
      if (!entry.isDirectory()) {
        return [];
      }
      const workspacePath = path.join(basePath, entry.name);
      if (!hasFile(workspacePath, "package.json")) {
        return [];
      }
      const packageJson = packageJsonOf(workspacePath);
      return [
        {
          hasLint: !isNil(packageJson.scripts?.["lint"]),
          hasTest: !isNil(packageJson.scripts?.["test"]),
          hasTsconfig: hasFile(workspacePath, "tsconfig.json"),
          name: entry.name,
          path: workspacePath,
          relativePath: `${prefix}/${entry.name}`,
          type: workspaceType(prefix)
        }
      ];
    });
  });
};

const isWithin = (candidate: string, workspacePath: string) => {
  const workspaceRelative = path.relative(workspacePath, candidate);
  return (
    !workspaceRelative.startsWith("..") && !path.isAbsolute(workspaceRelative)
  );
};

export const resolveFileTargets = (
  files: readonly string[],
  repoRoot: string,
  workspaces: readonly Workspace[],
  selectedWorkspaceNames: readonly string[]
) => {
  const selected = isEmpty(selectedWorkspaceNames)
    ? workspaces
    : filter(workspaces, (workspace) => {
        return selectedWorkspaceNames.includes(workspace.name);
      });
  const targetsByWorkspace = new Map<string, readonly string[]>();
  for (const rawFile of files) {
    const file = path.resolve(repoRoot, rawFile);
    const [candidateOwner] = filter(selected, (workspace) => {
      return isWithin(file, workspace.path);
    }).toSorted((left, right) => {
      return right.path.length - left.path.length;
    });
    const scope = isEmpty(selectedWorkspaceNames)
      ? "any workspace"
      : "the selected workspace";
    const owner =
      candidateOwner ?? fail(`File '${rawFile}' is not inside ${scope}.`);
    const target = split(path.relative(owner.path, file), path.sep).join("/");
    targetsByWorkspace.set(
      owner.name,
      uniq([...(targetsByWorkspace.get(owner.name) ?? []), target])
    );
  }
  const targeted = filter(selected, (workspace) => {
    return targetsByWorkspace.has(workspace.name);
  });
  return { selected: isEmpty(files) ? selected : targeted, targetsByWorkspace };
};

const isTestFile = (name: string) => {
  return some([".test.ts", ".test.tsx"], (suffix) => {
    return name.endsWith(suffix);
  });
};

export const findTestSiblings = (
  files: readonly string[],
  namesInDirectory: (directory: string) => readonly string[]
) => {
  return uniq(
    files.flatMap((file) => {
      const directory = path.dirname(file);
      return map(filter(namesInDirectory(directory), isTestFile), (name) => {
        return path.join(directory, name);
      });
    })
  );
};

export const testSiblingsInWorkspace = (
  workspace: Workspace,
  targets: readonly string[]
) => {
  const absoluteTargets = map(targets, (target) => {
    return path.join(workspace.path, target);
  });
  return map(
    findTestSiblings(absoluteTargets, (directory) => {
      return Array.from(
        filter(readdirSync(directory, { withFileTypes: true }), (entry) => {
          return entry.isFile();
        }),
        ({ name }) => {
          return name;
        }
      );
    }),
    (file) => {
      return split(path.relative(workspace.path, file), path.sep).join("/");
    }
  );
};

export const buildCliArguments = (
  workspace: Workspace,
  targets: readonly string[],
  isFixEnabled: boolean,
  testFiles: readonly string[]
) => {
  const checks = compact([
    workspace.hasLint ? "lint" : null,
    workspace.hasTsconfig ? "tsc" : null,
    workspace.hasTest ? "test" : null
  ]);
  const files = isEmpty(targets) ? ["."] : targets;
  const cliArguments = [
    "--cwd",
    workspace.path,
    "--files",
    JSON.stringify(files),
    "--checks",
    checks.join(",")
  ];
  if (isFixEnabled) {
    cliArguments.push("--fix");
  }
  if (!isEmpty(targets)) {
    cliArguments.push("--targeted-files", JSON.stringify(targets));
  }
  if (!isEmpty(testFiles)) {
    cliArguments.push("--test-files", JSON.stringify(testFiles));
  }
  return cliArguments;
};

export const runWithThrottle = async <A, B>(
  values: readonly A[],
  throttle: number,
  action: (value: A) => Promise<B>
) => {
  const batch = values.slice(0, throttle);
  if (isEmpty(batch)) {
    return [];
  }
  const pending: Promise<B>[] = Array.from(batch, async (value) => {
    return action(value);
  });
  const current = await Promise.all(pending);
  const remaining: readonly B[] = await runWithThrottle(
    values.slice(throttle),
    throttle,
    action
  );
  return [...current, ...remaining];
};

export const runWorkspace = (
  cliArguments: readonly string[],
  timeoutSeconds: number
) => {
  return Effect.tryPromise({
    catch: (cause) => {
      return cause;
    },
    try: async () => {
      return new Promise<RunnerOutput>((resolveResult, rejectResult) => {
        const runnerPath = path.join(
          import.meta.dirname,
          "run-workspace.cli.ts"
        );
        const child = execFile(
          process.execPath,
          [runnerPath, ...cliArguments],
          { encoding: "utf8", timeout: timeoutSeconds * 1000 },
          (_error, stdout, stderr) => {
            const decoded = Schema.decodeUnknownEither(
              Schema.parseJson(RunnerResultSchema)
            )(stdout);
            if ("Right" === decoded._tag) {
              resolveResult(decoded.right);
              return;
            }
            rejectResult(
              new Error(`run-workspace CLI returned invalid JSON: ${stderr}`)
            );
          }
        );
        child.on("error", rejectResult);
      });
    }
  });
};

export const toWorkspaceReport = (
  workspace: Workspace,
  result: RunnerOutput
) => {
  return {
    lint: result.lint,
    name: workspace.name,
    path: workspace.relativePath,
    test: { ...result.test, failedTests: result.test.failingTests },
    tsc: result.tsc
  };
};

export const failedWorkspaceReport = (workspace: Workspace, cause: unknown) => {
  const failedSlot = {
    errorCount: 1,
    passed: false,
    ran: true,
    warningCount: 0
  };
  return {
    error: String(cause),
    lint: {
      ...failedSlot,
      autofix: null,
      fixableErrorCount: 0,
      fixableWarningCount: 0,
      issues: []
    },
    name: workspace.name,
    path: workspace.relativePath,
    test: { failedTests: [], failingTests: [], passed: false, ran: true },
    tsc: failedSlot
  };
};

export const writeProgress = (message: string) => {
  process.stderr.write(`${message}\n`);
};

export const renderMarkdown = async (report: string) => {
  await renderFromStdin(Readable.from([report]));
};

const setExitCode = (exitCode: number) => {
  process.exitCode = exitCode;
};

export const main = async (argv: readonly string[] = process.argv.slice(2)) => {
  const options = parseArguments(argv);
  const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..", "..");
  const allWorkspaces = discoverWorkspaces(repoRoot);
  const { selected, targetsByWorkspace } = resolveFileTargets(
    options.files,
    repoRoot,
    allWorkspaces,
    options.workspaces
  );
  writeProgress(
    `Discovered ${selected.length} workspace(s); running with throttle=${options.throttle}, timeout=${options.timeoutSeconds}s.`
  );
  const startedAt = formatIso(unsafeNow());
  const reports = await runWithThrottle(
    selected,
    options.throttle,
    async (workspace) => {
      const targets = targetsByWorkspace.get(workspace.name) ?? [];
      const testFiles = isEmpty(targets)
        ? []
        : testSiblingsInWorkspace(workspace, targets);
      const cliArguments = buildCliArguments(
        workspace,
        targets,
        !options.skipFix,
        testFiles
      );
      const outcome = await Effect.runPromiseExit(
        runWorkspace(cliArguments, options.timeoutSeconds)
      );
      return "Success" === outcome._tag
        ? toWorkspaceReport(workspace, outcome.value)
        : failedWorkspaceReport(workspace, outcome.cause);
    }
  );
  const finishedAt = formatIso(unsafeNow());
  const report = buildCheckReport(
    startedAt,
    finishedAt,
    reports,
    !options.skipFix
  );
  const text = JSON.stringify(report);
  if ("Json" === options.format) {
    process.stdout.write(`${text}\n`);
  } else {
    await renderMarkdown(text);
  }
  writeProgress(
    0 === report.exitCode ? "All checks passed." : "Checks failed."
  );
  setExitCode(report.exitCode);
};

/* v8 ignore next 3 -- import.meta.main is true only when Bun launches this CLI. */
if (import.meta.main) {
  await main();
}
