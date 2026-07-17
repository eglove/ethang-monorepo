import { Effect, Schema } from "effect";
import isFunction from "lodash/isFunction.js";
import map from "lodash/map.js";
import split from "lodash/split.js";
import path from "node:path";

import type {
  AutofixFileEntry,
  AutofixMessage
} from "../domain/eslint-autofix.ts";

const SEVERITY_ERROR = 2;
const SEVERITY_WARNING = 1;
const NULL_VALUE = null;

export type EslintCtor = new (options: {
  cwd: string;
  fix: boolean;
}) => EslintInstance;

export type EslintCtorWithFixes = EslintCtor & {
  outputFixes?: (results: readonly EslintResultLike[]) => Promise<unknown>;
};

export type EslintMessageLike = {
  column?: number;
  fix?: unknown;
  line?: number;
  message?: string;
  ruleId?: null | string;
  severity?: number;
};

export type EslintResultLike = {
  filePath: string;
  messages?: readonly EslintMessageLike[];
};

type EslintInstance = {
  lintFiles: (files: readonly string[]) => Promise<readonly EslintResultLike[]>;
};

class EslintNotFoundError extends Error {
  public override readonly name = "EslintNotFoundError";
}

const EslintCtorSchema = Schema.Struct({
  ESLint: Schema.optional(Schema.Unknown)
});

const EslintModuleSchema = Schema.Struct({
  default: Schema.optional(EslintCtorSchema),
  ESLint: Schema.optional(Schema.Unknown)
});

const EslintModuleDecoder = Schema.decodeUnknown(EslintModuleSchema);

const decode = (raw: unknown) => {
  return EslintModuleDecoder(raw);
};

const runDecodeEslintModule = (raw: unknown) => {
  const decoded = decode(raw);
  return Effect.runSync(decoded);
};

const isCtorLike = (value: unknown): value is EslintCtorWithFixes => {
  return isFunction(value);
};

const toEslintCtor = (value: unknown) => {
  if (isCtorLike(value)) {
    return value;
  }
  return NULL_VALUE;
};

const toPosix = (input: string) => {
  return split(input, path.sep).join("/");
};

const normalizeFilePath = (filePath: string, cwd: string) => {
  const absolute = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(cwd, filePath);
  return toPosix(path.relative(cwd, absolute));
};

const isValidSeverity = (
  severity: number
): severity is AutofixMessage["severity"] => {
  if (SEVERITY_ERROR === severity) {
    return true;
  }
  return SEVERITY_WARNING === severity;
};

const projectMessage = (message: EslintMessageLike) => {
  const severity = message.severity ?? SEVERITY_WARNING;
  return {
    column: message.column ?? 0,
    fixable: Boolean(message.fix),
    line: message.line ?? 0,
    message: message.message ?? "",
    ruleId: message.ruleId ?? NULL_VALUE,
    severity: isValidSeverity(severity) ? severity : SEVERITY_WARNING
  };
};

const projectResult = (
  pre: EslintResultLike,
  postByAbs: Map<string, readonly EslintMessageLike[]>,
  cwd: string
) => {
  const postMessages = postByAbs.get(path.resolve(pre.filePath)) ?? [];
  return {
    filePath: normalizeFilePath(pre.filePath, cwd),
    postFixMessages: map(postMessages, projectMessage),
    preFixMessages: map(pre.messages ?? [], projectMessage)
  };
};

const importEslintModule = () => {
  return Effect.tryPromise(async () => {
    return import("eslint");
  });
};

const resolveEslintCtor = (raw: unknown) => {
  const decoded = runDecodeEslintModule(raw);
  return toEslintCtor(decoded.ESLint) ?? toEslintCtor(decoded.default?.ESLint);
};

export const loadEslintCtor = () => {
  return Effect.gen(function* () {
    const raw = yield* importEslintModule();
    const ctor = resolveEslintCtor(raw);
    if (isNilCtor(ctor)) {
      return yield* Effect.fail(
        new EslintNotFoundError(
          "eslint-loader: ESLint class not found in 'eslint' module export"
        )
      );
    }
    return ctor;
  });
};

const isNilCtor = (value: EslintCtorWithFixes | null): value is null => {
  return value === NULL_VALUE;
};

const callOutputFixes = (
  ctor: EslintCtorWithFixes,
  results: readonly EslintResultLike[]
) => {
  return Effect.gen(function* () {
    const { outputFixes } = ctor;
    if (!isFunction(outputFixes)) {
      return;
    }
    yield* Effect.tryPromise(async () => {
      return outputFixes(results);
    }).pipe(Effect.ignoreLogged);
  });
};

export type LoadAutofixResults = {
  cwd: string;
  files: readonly string[];
  results: readonly AutofixFileEntry[];
};

export type LoadAutofixResultsOptions = {
  cwd: string;
  files: readonly string[];
  fix?: boolean;
};

const runLintPass = (eslint: EslintInstance, files: readonly string[]) => {
  return Effect.tryPromise({
    catch: (error) => {
      return error;
    },
    try: async () => {
      return eslint.lintFiles([...files]);
    }
  });
};

export const loadAutofixResults = (options: LoadAutofixResultsOptions) => {
  return Effect.gen(function* () {
    const cwd = path.resolve(options.cwd);
    const isFix = options.fix ?? true;
    const ctor = yield* loadEslintCtor();
    const eslint = new ctor({ cwd, fix: isFix });

    const preResults = yield* runLintPass(eslint, options.files);
    if (isFix) {
      yield* callOutputFixes(ctor, preResults);
    }
    const postResults = yield* runLintPass(eslint, options.files);

    const postByAbs = new Map<string, readonly EslintMessageLike[]>();
    for (const result of postResults) {
      postByAbs.set(path.resolve(result.filePath), result.messages ?? []);
    }

    return {
      cwd,
      files: map(options.files, (file) => {
        return normalizeFilePath(file, cwd);
      }),
      results: map(preResults, (pre) => {
        return projectResult(pre, postByAbs, cwd);
      })
    };
  });
};
