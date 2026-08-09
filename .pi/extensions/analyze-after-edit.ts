import isError from "lodash/isError.js";
import map from "lodash/map.js";
import reduce from "lodash/reduce.js";
import trim from "lodash/trim.js";
import path from "node:path";

const ESLINT_TIMEOUT_MS = 120_000;
const MAX_FEEDBACK_CHARS = 12_000;
const STATUS_KEY = "analyze-after-edit";

export type AnalysisDependencies = {
  exec: ExtensionApi["exec"];
  fetch: typeof fetch;
};

type PostEditStatus = {
  level: "info" | "warning" | "error";
  text: string;
};

export type AnalysisToolResultEvent = {
  content: ({ [key: string]: unknown; type: string } | TextContent)[];
  input: Record<string, unknown>;
  isError: boolean;
  toolName: string;
};

type AnalysisContext = {
  cwd: string;
  /** Whether the running pi mode can surface UI (pi-lens guards on `ctx.hasUI`). */
  hasUI?: boolean;
  signal?: AbortSignal | undefined;
  /** pi extension UI context (pi-lens `ctx.ui`): used for notify/setStatus status display. */
  ui?: {
    notify(message: string, type?: "info" | "warning" | "error"): void;
    setStatus(key: string, text: string | undefined): void;
    theme: { fg(color: string, text: string): string };
  };
};

type EslintFeedback = {
  exitCode: number;
  results?: EslintFileResult[];
  stderr: string;
};

type EslintFileResult = {
  errorCount?: number;
  filePath?: string;
  messages?: EslintMessage[];
  warningCount?: number;
};

type EslintMessage = {
  column?: number;
  line?: number;
  message?: string;
  ruleId?: null | string;
  severity?: number;
};

type ExecOptions = {
  cwd?: string;
  signal?: AbortSignal | undefined;
  timeout?: number;
};

type ExecResult = {
  code: number;
  killed: boolean;
  stderr: string;
  stdout: string;
};

type ExtensionApi = {
  exec: (
    command: string,
    arguments_: string[],
    options?: ExecOptions
  ) => Promise<ExecResult>;
  on: (
    event: "tool_result",
    handler: (
      event: AnalysisToolResultEvent,
      context: ToolResultContext
    ) => Promise<ToolResultPatch | undefined>
  ) => void;
};

type TextContent = {
  text: string;
  type: "text";
};

type ToolResultContext = {
  hasUI: boolean;
  signal?: AbortSignal;
  ui: {
    notify(message: string, type?: "info" | "warning" | "error"): void;
    setStatus(key: string, text: string | undefined): void;
    theme: { fg(color: string, text: string): string };
  };
} & AnalysisContext;

type ToolResultPatch = {
  content?: AnalysisToolResultEvent["content"];
};

const asErrorMessage = (error: unknown) => {
  return isError(error) ? error.message : String(error);
};

const toSlashPath = (path: string) => {
  // Regex (not ES2021 `replaceAll`) so the standalone `.pi` script does not
  // depend on a newer lib target than the tooling that type-checks it.
  return path.replace(/\\/g, "/");
};

const getRelativeProjectPath = (
  cwd: string,
  input: unknown
): string | undefined => {
  if ("string" !== typeof input || 0 === trim(input).length) return undefined;

  const absolutePath = path.resolve(cwd, input);
  const relativePath = path.relative(cwd, absolutePath);
  const isEscapesProject =
    ".." === relativePath ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath);

  return isEscapesProject ? undefined : toSlashPath(relativePath);
};

const parseJson = <T>(value: string): T | undefined => {
  if (0 === trim(value).length) return undefined;

  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
};

const runEslintFix = async (
  dependencies: AnalysisDependencies,
  cwd: string,
  filePath: string,
  signal: AbortSignal | undefined
) => {
  try {
    const result = await dependencies.exec(
      "pnpm",
      ["exec", "eslint", "--no-ignore", "--fix", "--format", "json", filePath],
      { cwd, signal, timeout: ESLINT_TIMEOUT_MS }
    );

    return {
      exitCode: result.code,
      results: parseJson<EslintFileResult[]>(result.stdout) ?? [],
      stderr: trim(result.stderr)
    } satisfies EslintFeedback;
  } catch (error) {
    return {
      exitCode: 1,
      results: [],
      stderr: asErrorMessage(error)
    } satisfies EslintFeedback;
  }
};

const formatEslintFeedback = (feedback: EslintFeedback) => {
  const messages = feedback.results?.flatMap((result) => {
    return map(result.messages ?? [], (message) => {
      const severity = 2 === message.severity ? "error" : "warning";
      const location = `${message.line ?? "?"}:${message.column ?? "?"}`;
      const rule = message.ruleId ? ` [${message.ruleId}]` : "";
      return `- ${severity} ${location} ${message.message ?? "Unknown ESLint problem"}${rule}`;
    });
  });
  const totals = reduce(
    feedback.results,
    (accumulator, result) => {
      return {
        errors: accumulator.errors + (result.errorCount ?? 0),
        warnings: accumulator.warnings + (result.warningCount ?? 0)
      };
    },
    { errors: 0, warnings: 0 }
  );

  if (feedback.stderr) {
    return `ESLint --fix failed (exit ${feedback.exitCode}):\n${feedback.stderr}`;
  }
  if (messages && 0 < messages.length) {
    return `ESLint --fix completed with ${totals?.errors ?? 0} error(s) and ${totals?.warnings ?? 0} warning(s):\n${messages.join("\n")}`;
  }
  if (0 !== feedback.exitCode) {
    return `ESLint --fix exited with code ${feedback.exitCode} without diagnostic output.`;
  }

  return "ESLint --fix completed with no remaining reported problems.";
};

const formatPostEditStatus = (
  filePath: string,
  eslint: EslintFeedback
): PostEditStatus => {
  const problemCount =
    reduce(
      eslint.results,
      (accumulator, result) => {
        return accumulator + (result.errorCount ?? 0);
      },
      0
    );
  const failures = eslint.stderr ? 1 : 0;

  if (failures > 0) {
    return {
      level: "warning",
      text: `Post-edit analysis for ${filePath} could not fully complete (${failures} analyzer error${1 < failures ? "s" : ""}).`
    } satisfies PostEditStatus;
  }
  if (0 < problemCount) {
    return {
      level: "warning",
      text: `Post-edit analysis for ${filePath} found ${problemCount} problem(s).`
    } satisfies PostEditStatus;
  }
  return {
    level: "info",
    text: `Post-edit analysis for ${filePath}: no problems found.`
  } satisfies PostEditStatus;
};

const truncateFeedback = (feedback: string) => {
  return feedback.length <= MAX_FEEDBACK_CHARS
    ? feedback
    : `${feedback.slice(0, MAX_FEEDBACK_CHARS)}\n[Analysis feedback truncated]`;
};

export const createAnalyzeAfterEditHandler = (
  dependencies: AnalysisDependencies
) => {
  return async (event: AnalysisToolResultEvent, context: AnalysisContext) => {
    if (
      event.isError ||
      ("edit" !== event.toolName && "write" !== event.toolName)
    ) {
      return;
    }

    const filePath = getRelativeProjectPath(context.cwd, event.input["path"]);
    if (!filePath) return;

    // pi-lens status-display convention: transient `ctx.ui.notify` toast and a
    // persistent `ctx.ui.setStatus` footer indicator, both guarded by `ctx.hasUI`.
    const notify = (message: string, level: "info" | "warning" | "error") => {
      if (context.hasUI && context.ui) {
        context.ui.notify(`[analyze-after-edit] ${message}`, level);
      }
    };
    const setStatus = (text: string | undefined) => {
      if (context.hasUI && context.ui) {
        if (undefined === text) {
          context.ui.setStatus(STATUS_KEY, undefined);
        } else {
          context.ui.setStatus(STATUS_KEY, context.ui.theme.fg("accent", text));
        }
      }
    };

    // Persistent footer indicator while the analyzers run (pi-lens setStatus style).
    setStatus(`analyzing ${filePath}…`);

    const eslint = await runEslintFix(
      dependencies,
      context.cwd,
      filePath,
      context.signal
    );
    const feedback = truncateFeedback(
      `Post-edit analysis for ${filePath}:\n${formatEslintFeedback(eslint)}`
    );
    const status = formatPostEditStatus(filePath, eslint);

    // pi-lens `ctx.ui.notify` style: a transient toast summarizing the result.
    setStatus(undefined);
    notify(status.text, status.level);

    return {
      // The full feedback still flows to the LLM via the tool_result patch.
      content: [...event.content, { text: feedback, type: "text" }]
    };
  };
};

export default function analyzeAfterEdit(pi: ExtensionApi) {
  const handler = createAnalyzeAfterEditHandler({
    exec: async (command, arguments_, options) => {
      return pi.exec(command, arguments_, options);
    },
    fetch: globalThis.fetch
  });

  pi.on("tool_result", async (event, context) => {
    return handler(event, {
      cwd: context.cwd,
      hasUI: context.hasUI,
      signal: context.signal,
      ui: context.ui
    });
  });
}
