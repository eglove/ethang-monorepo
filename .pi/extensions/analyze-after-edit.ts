import isError from "lodash/isError.js";
import isEmpty from "lodash/isEmpty.js";
import map from "lodash/map.js";
import reduce from "lodash/reduce.js";
import trim from "lodash/trim.js";
import path from "node:path";

const MCP_ENDPOINT = "http://127.0.0.1:64506/stream";
const MCP_PROTOCOL_VERSION = "2025-03-26";
const ESLINT_TIMEOUT_MS = 120_000;
const WEBSTORM_TIMEOUT_MS = 10_000;
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
		options?: ExecOptions,
	) => Promise<ExecResult>;
	on: (
		event: "tool_result",
		handler: (
			event: AnalysisToolResultEvent,
			context: ToolResultContext,
		) => Promise<ToolResultPatch | undefined>,
	) => void;
};

type JsonRpcError = {
	code: number;
	message: string;
};

type JsonRpcResponse<TResult> = {
	error?: JsonRpcError;
	id?: number;
	jsonrpc: "2.0";
	result?: TResult;
};

type McpToolResult = {
	content?: TextContent[];
	isError?: boolean;
	structuredContent?: WebStormProblems;
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

type WebStormFeedback = {
	error?: string;
	problems?: WebStormProblems;
};

type WebStormProblem = {
	column: number;
	description: string;
	line: number;
	lineContent: string;
	severity: string;
};

type WebStormProblems = {
	errors: WebStormProblem[];
	filePath: string;
	timedOut?: boolean | null;
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
	input: unknown,
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

const postMcp = async <TResult>(
	dependencies: AnalysisDependencies,
	projectPath: string,
	payload: object,
	signal: AbortSignal | undefined,
	sessionId?: string,
) => {
	const headers = new Headers({
		Accept: "application/json, text/event-stream",
		"Content-Type": "application/json",
		IJ_MCP_SERVER_PROJECT_PATH: toSlashPath(projectPath),
	});
	if (sessionId) headers.set("Mcp-Session-Id", sessionId);

	const response = await dependencies.fetch(MCP_ENDPOINT, {
		body: JSON.stringify(payload),
		headers,
		method: "POST",
		signal: signal ?? null,
	});
	if (!response.ok) {
		throw new Error(
			`WebStorm MCP request failed (${response.status} ${response.statusText}): ${await response.text()}`,
		);
	}

	const text = await response.text();
	const isEmptyAcknowledgement = "null" === trim(text);
	const message = isEmptyAcknowledgement
		? undefined
		: parseJson<JsonRpcResponse<TResult>>(text);
	if (0 < text.length && !isEmptyAcknowledgement && !message) {
		throw new Error(`WebStorm MCP returned invalid JSON: ${text}`);
	}
	if (message?.error) {
		throw new Error(
			`WebStorm MCP error ${message.error.code}: ${message.error.message}`,
		);
	}

	return { response, result: message?.result };
};

const getWebStormProblems = async (
	dependencies: AnalysisDependencies,
	cwd: string,
	filePath: string,
	signal: AbortSignal | undefined,
) => {
	let sessionId: string | undefined;

	try {
		const initialized = await postMcp<{ protocolVersion: string }>(
			dependencies,
			cwd,
			{
				id: 1,
				jsonrpc: "2.0",
				method: "initialize",
				params: {
					capabilities: {},
					clientInfo: {
						name: "pi-analyze-after-edit",
						version: "1.0.0",
					},
					protocolVersion: MCP_PROTOCOL_VERSION,
				},
			},
			signal,
		);
		sessionId = initialized.response.headers.get("Mcp-Session-Id") ?? undefined;
		if (!sessionId) {
			return {
				error: "WebStorm MCP initialize response omitted Mcp-Session-Id",
			} satisfies WebStormFeedback;
		}

		await postMcp(
			dependencies,
			cwd,
			{
				jsonrpc: "2.0",
				method: "notifications/initialized",
				params: {},
			},
			signal,
			sessionId,
		);

		const call = await postMcp<McpToolResult>(
			dependencies,
			cwd,
			{
				id: 2,
				jsonrpc: "2.0",
				method: "tools/call",
				params: {
					arguments: {
						errorsOnly: false,
						filePath,
						timeout: WEBSTORM_TIMEOUT_MS,
					},
					name: "get_file_problems",
				},
			},
			signal,
			sessionId,
		);
		if (call.result?.isError) {
			return {
				error:
					map(call.result.content, ({ text }) => {
						return text;
					}).join("\n") || "WebStorm get_file_problems failed",
			} satisfies WebStormFeedback;
		}

		const textResult = call.result?.content?.find(
			(content): content is TextContent => {
				return "text" === content.type;
			},
		);
		const problems =
			call.result?.structuredContent ??
			(textResult ? parseJson<WebStormProblems>(textResult.text) : undefined);
		if (!problems) {
			return {
				error: "WebStorm get_file_problems returned no structured result",
			} satisfies WebStormFeedback;
		}

		return { problems } satisfies WebStormFeedback;
	} catch (error) {
		return { error: asErrorMessage(error) } satisfies WebStormFeedback;
	} finally {
		if (sessionId) {
			try {
				await dependencies.fetch(MCP_ENDPOINT, {
					headers: {
						Accept: "application/json, text/event-stream",
						IJ_MCP_SERVER_PROJECT_PATH: toSlashPath(cwd),
						"Mcp-Session-Id": sessionId,
					},
					method: "DELETE",
					signal: signal ?? null,
				});
			} catch {
				// Session cleanup must not hide analysis feedback.
			}
		}
	}
};

const runEslintFix = async (
	dependencies: AnalysisDependencies,
	cwd: string,
	filePath: string,
	signal: AbortSignal | undefined,
) => {
	try {
		const result = await dependencies.exec(
			"pnpm",
			["exec", "eslint", "--no-ignore", "--fix", "--format", "json", filePath],
			{ cwd, signal, timeout: ESLINT_TIMEOUT_MS },
		);

		return {
			exitCode: result.code,
			results: parseJson<EslintFileResult[]>(result.stdout) ?? [],
			stderr: trim(result.stderr),
		} satisfies EslintFeedback;
	} catch (error) {
		return {
			exitCode: 1,
			results: [],
			stderr: asErrorMessage(error),
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
				warnings: accumulator.warnings + (result.warningCount ?? 0),
			};
		},
		{ errors: 0, warnings: 0 },
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
	eslint: EslintFeedback,
	webStorm: WebStormFeedback,
): PostEditStatus => {
	const problemCount =
		reduce(
			eslint.results,
			(accumulator, result) => {
				return accumulator + (result.errorCount ?? 0);
			},
			0,
		) + (webStorm.problems?.errors.length ?? 0);
	const failures = (eslint.stderr ? 1 : 0) + (webStorm.error ? 1 : 0);

	if (failures > 0) {
		return {
			level: "warning",
			text: `Post-edit analysis for ${filePath} could not fully complete (${failures} analyzer error${1 < failures ? "s" : ""}).`,
		} satisfies PostEditStatus;
	}
	if (0 < problemCount) {
		return {
			level: "warning",
			text: `Post-edit analysis for ${filePath} found ${problemCount} problem(s).`,
		} satisfies PostEditStatus;
	}
	return {
		level: "info",
		text: `Post-edit analysis for ${filePath}: no problems found.`,
	} satisfies PostEditStatus;
};

const formatWebStormFeedback = (feedback: WebStormFeedback) => {
	if (feedback.error) return `WebStorm analysis failed: ${feedback.error}`;

	const problems = feedback.problems?.errors ?? [];
	if (isEmpty(problems)) {
		return "WebStorm get_file_problems (errorsOnly: false) found no problems.";
	}

	const lines = map(problems, (problem) => {
		return `- ${problem.severity.toLowerCase()} ${problem.line}:${problem.column} ${problem.description}\n  ${problem.lineContent}`;
	});
	const timeout = feedback.problems?.timedOut
		? "\nThe WebStorm inspection timed out; results may be partial."
		: "";

	return `WebStorm get_file_problems (errorsOnly: false) found ${problems.length} problem(s):\n${lines.join("\n")}${timeout}`;
};

const truncateFeedback = (feedback: string) => {
	return feedback.length <= MAX_FEEDBACK_CHARS
		? feedback
		: `${feedback.slice(0, MAX_FEEDBACK_CHARS)}\n[Analysis feedback truncated]`;
};

export const createAnalyzeAfterEditHandler = (
	dependencies: AnalysisDependencies,
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
			context.signal,
		);
		const webStorm = await getWebStormProblems(
			dependencies,
			context.cwd,
			filePath,
			context.signal,
		);
		const feedback = truncateFeedback(
			[
				`Post-edit analysis for ${filePath}:`,
				formatEslintFeedback(eslint),
				formatWebStormFeedback(webStorm),
			].join("\n\n"),
		);
		const status = formatPostEditStatus(filePath, eslint, webStorm);

		// pi-lens `ctx.ui.notify` style: a transient toast summarizing the result.
		setStatus(undefined);
		notify(status.text, status.level);

		return {
			// The full feedback still flows to the LLM via the tool_result patch.
			content: [...event.content, { text: feedback, type: "text" }],
		};
	};
};

export default function analyzeAfterEdit(pi: ExtensionApi) {
const handler = createAnalyzeAfterEditHandler({
exec: async (command, arguments_, options) => {
return pi.exec(command, arguments_, options);
},
fetch: globalThis.fetch,
});

	pi.on("tool_result", async (event, context) => {
		return handler(event, {
			cwd: context.cwd,
			hasUI: context.hasUI,
			signal: context.signal,
			ui: context.ui,
		});
	});
}
