import constant from "lodash/constant.js";
import isObject from "lodash/isObject.js";
import noop from "lodash/noop.js";
import { describe, expect, it, vi } from "vitest";

import type { ClaudeAdapter, ClaudeResult } from "../ports/claude-adapter.ts";
import type { GitAdapter } from "../ports/git-adapter.ts";
import type { EslintRunner } from "../stages/lint-fixer.ts";
import type { SessionResult } from "../stages/questioner-session.ts";
import type { QuestionerRunner } from "./orchestrator.ts";
import type { PipelineStore } from "./pipeline-store.ts";

import { defaultPipelineConfig } from "../constants.ts";

const BRIEFING_PATH = "docs/questioner-sessions/test-briefing.md";
const ASK_USER_PROMPT = "test prompt";

const anyFunction: unknown = expect.any(Function);

type AskUserPort = { askUser: (prompt: string) => Promise<string> };

function extractAskUser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- vitest mock type requires any
  runLintFixer: (...arguments_: any[]) => any,
): AskUserPort | undefined {
  const callbackArgument: unknown = vi.mocked(runLintFixer).mock.calls[0]?.[3];
  if (isObject(callbackArgument) && "askUser" in callbackArgument) {
    // @ts-expect-error -- test helper narrows mock argument to AskUserPort
    return callbackArgument;
  }
  return undefined;
}

vi.mock("../stages/debate-moderator.ts", () => ({
  executeDebateModerator: vi.fn(
    async (_adapter: ClaudeAdapter, _config: unknown, store: PipelineStore) => {
      await Promise.resolve();
      store.finishExecution();
      store.validationPass();
      return { artifact: undefined, success: true };
    },
  ),
}));

vi.mock("../stages/tla-writer.ts", () => ({
  async executeTlaWriter(
    _adapter: ClaudeAdapter,
    _config: unknown,
    store: PipelineStore,
  ) {
    await Promise.resolve();
    store.finishExecution();
    store.validationPass();
    return { artifact: undefined, success: true };
  },
}));

vi.mock("../stages/expert-review.ts", () => ({
  async executeExpertReview(
    _adapter: ClaudeAdapter,
    _config: unknown,
    store: PipelineStore,
  ) {
    await Promise.resolve();
    store.finishExecution();
    store.validationPass();
    return { artifact: undefined, success: true };
  },
}));

vi.mock("../stages/implementation-planning.ts", () => ({
  async executeImplementationPlanning(
    _adapter: ClaudeAdapter,
    _config: unknown,
    store: PipelineStore,
  ) {
    await Promise.resolve();
    store.finishExecution();
    store.validationPass();
    return { artifact: undefined, success: true };
  },
  executeStreamingConfirmation: vi.fn(
    async (
      _adapter: ClaudeAdapter,
      store: PipelineStore,
      maxStreamTurns: number,
    ) => {
      await Promise.resolve();
      store.streamInput(maxStreamTurns);
      return { turns: 1 };
    },
  ),
}));

vi.mock("../stages/pair-programming.ts", () => ({
  async executePairProgramming(
    _adapter: ClaudeAdapter,
    _git: GitAdapter,
    _config: unknown,
    store: PipelineStore,
  ) {
    await Promise.resolve();
    store.finishExecution();
    store.validationPass();
    store.gitSuccess();
    return { artifact: undefined, success: true };
  },
  async executePairRouting(_adapter: ClaudeAdapter, store: PipelineStore) {
    await Promise.resolve();
    store.completePairRouting();
    return { success: true };
  },
}));

vi.mock("../stages/lint-fixer.ts", () => ({
  runLintFixer: vi.fn().mockResolvedValue({
    cleanRuns: 2,
    escalationCount: 0,
    success: true,
    totalAttempts: 1,
  }),
}));

vi.mock("../stages/fork-join.ts", () => ({
  async executeForkJoin(
    _adapter: ClaudeAdapter,
    _git: GitAdapter,
    _config: unknown,
    store: PipelineStore,
  ) {
    await Promise.resolve();
    store.finishExecution();
    store.validationPass();
    store.gitSuccess();
    return { artifact: undefined, success: true };
  },
}));

function makeClaudeAdapter(): ClaudeAdapter {
  const defaultResponse: ClaudeResult = { data: {}, ok: true };
  return {
    async executePrompt() {
      await Promise.resolve();
      return defaultResponse;
    },
    async routePairMessage() {
      await Promise.resolve();
      return defaultResponse;
    },
    async streamPrompt() {
      await Promise.resolve();
      return defaultResponse;
    },
  };
}

function makeGitAdapter(): GitAdapter {
  return {
    acquireLock: constant(true),
    async checkout() {
      await Promise.resolve();
      return { ok: true };
    },
    async commit() {
      await Promise.resolve();
      return { ok: true };
    },
    async createBranch() {
      await Promise.resolve();
      return { ok: true };
    },
    getCurrentBranch: constant(Promise.resolve("main")),
    async push() {
      await Promise.resolve();
      return { ok: true };
    },
    releaseLock: noop,
  };
}

// eslint-disable-next-line @typescript-eslint/require-await
const questionerRunner: QuestionerRunner = async () =>
  makeSuccessfulSessionResult();

function makeBriefingSessionResult(): SessionResult {
  return {
    artifact: {
      artifactState: "complete" as const,
      questions: [{ answer: "a", question: "q" }],
      sessionState: "completed" as const,
      summary: "S",
      turnCount: 1,
    },
    briefingPath: BRIEFING_PATH,
    success: true,
  };
}

function makeSuccessfulSessionResult(): SessionResult {
  return {
    artifact: {
      artifactState: "complete",
      questions: [{ answer: "constraint-1", question: "requirement-1" }],
      sessionState: "completed",
      summary: "Test summary",
      turnCount: 2,
    },
    briefingPath: null,
    success: true,
  };
}

// eslint-disable-next-line @typescript-eslint/require-await
const runnerWithBriefing: QuestionerRunner = async () =>
  makeBriefingSessionResult();

// eslint-disable-next-line @typescript-eslint/require-await
const nullSummaryRunner: QuestionerRunner = async () => ({
  artifact: {
    artifactState: "complete" as const,
    questions: [{ answer: "a", question: "q" }],
    sessionState: "completed" as const,
    summary: null,
    turnCount: 1,
  },
  briefingPath: null,
  success: true,
});

describe("Orchestrator ?? fallback branches", () => {
  it("exercises all ?? fallbacks when stage artifacts are missing", async () => {
    const { executeOrchestrator } = await import("../engine/orchestrator.ts");

    const claude = makeClaudeAdapter();
    const git = makeGitAdapter();
    const result = await executeOrchestrator(
      {
        claudeAdapter: claude,
        config: defaultPipelineConfig,
        gitAdapter: git,
        questionerRunner,
      },
      undefined,
      "run-fallback",
    );

    expect(result.success).toBe(true);
    expect(result.state.state).toBe("completed");
  });

  it("uses default config and runId when not provided", async () => {
    const { executeOrchestrator } = await import("../engine/orchestrator.ts");

    const claude = makeClaudeAdapter();
    const git = makeGitAdapter();
    const result = await executeOrchestrator({
      claudeAdapter: claude,
      gitAdapter: git,
      questionerRunner,
    });

    expect(result.success).toBe(true);
  });

  it("runs lint-fixer when briefingPath, anthropicClient, and eslintRunner are provided", async () => {
    const { executeOrchestrator } = await import("../engine/orchestrator.ts");
    const { runLintFixer } = await import("../stages/lint-fixer.ts");

    const claude = makeClaudeAdapter();
    const git = makeGitAdapter();

    const anthropicClient = {
      messages: { create: constant(Promise.resolve({ content: [] })) },
    };
    const eslintRunner: EslintRunner = {
      fix: vi.fn().mockReturnValue({ clean: true, errors: "" }),
    };

    const result = await executeOrchestrator(
      {
        anthropicClient,
        claudeAdapter: claude,
        config: defaultPipelineConfig,
        eslintRunner,
        gitAdapter: git,
        questionerRunner: runnerWithBriefing,
      },
      undefined,
      "run-lint-fixer",
    );

    expect(result.success).toBe(true);
    expect(runLintFixer).toHaveBeenCalledOnce();
    // Verify non-interactive mode (no readlinePort)
    expect(runLintFixer).toHaveBeenCalledWith(
      BRIEFING_PATH,
      expect.objectContaining({ interactive: false, maxLintPasses: 10 }),
      expect.objectContaining({ messages: anthropicClient.messages }),
      expect.objectContaining({ askUser: anyFunction }),
      eslintRunner,
    );

    // Exercise the askUser callback to cover the readlinePort === undefined branch (line 568)
    const askUserPort = extractAskUser(runLintFixer);
    if (askUserPort) {
      const answer = await askUserPort.askUser(ASK_USER_PROMPT);
      expect(answer).toBe("");
    }
  });

  it("runs lint-fixer with rootDirectory to build full recipesPath", async () => {
    const { executeOrchestrator } = await import("../engine/orchestrator.ts");
    const { runLintFixer } = await import("../stages/lint-fixer.ts");

    vi.mocked(runLintFixer).mockClear();

    const claude = makeClaudeAdapter();
    const git = makeGitAdapter();

    const anthropicClient = {
      messages: { create: constant(Promise.resolve({ content: [] })) },
    };
    const eslintRunner: EslintRunner = {
      fix: vi.fn().mockReturnValue({ clean: true, errors: "" }),
    };

    const result = await executeOrchestrator(
      {
        anthropicClient,
        claudeAdapter: claude,
        config: defaultPipelineConfig,
        eslintRunner,
        gitAdapter: git,
        questionerRunner: runnerWithBriefing,
        rootDirectory: "/workspace",
      },
      undefined,
      "run-lint-fixer-root-dir",
    );

    expect(result.success).toBe(true);
    expect(runLintFixer).toHaveBeenCalledOnce();
    expect(runLintFixer).toHaveBeenCalledWith(
      BRIEFING_PATH,
      expect.objectContaining({
        interactive: false,
        maxLintPasses: 10,
        recipesPath:
          "/workspace/packages/design-pipeline/lint-fixer-recipes.md",
      }),
      expect.objectContaining({ messages: anthropicClient.messages }),
      expect.objectContaining({ askUser: anyFunction }),
      eslintRunner,
    );
  });

  it("runs lint-fixer in interactive mode when readlinePort is provided", async () => {
    const { executeOrchestrator } = await import("../engine/orchestrator.ts");
    const { runLintFixer } = await import("../stages/lint-fixer.ts");

    vi.mocked(runLintFixer).mockClear();

    const claude = makeClaudeAdapter();
    const git = makeGitAdapter();

    const anthropicClient = {
      messages: { create: constant(Promise.resolve({ content: [] })) },
    };
    const eslintRunner: EslintRunner = {
      fix: vi.fn().mockReturnValue({ clean: true, errors: "" }),
    };
    const readlinePort = {
      close: noop,
      question: vi.fn().mockResolvedValue("user answer"),
    };

    const result = await executeOrchestrator(
      {
        anthropicClient,
        claudeAdapter: claude,
        config: defaultPipelineConfig,
        eslintRunner,
        gitAdapter: git,
        questionerRunner: runnerWithBriefing,
        readlinePort,
      },
      undefined,
      "run-lint-fixer-interactive",
    );

    expect(result.success).toBe(true);
    expect(runLintFixer).toHaveBeenCalledOnce();
    expect(runLintFixer).toHaveBeenCalledWith(
      BRIEFING_PATH,
      expect.objectContaining({ interactive: true, maxLintPasses: 10 }),
      expect.objectContaining({ messages: anthropicClient.messages }),
      expect.objectContaining({ askUser: anyFunction }),
      eslintRunner,
    );

    // Exercise the askUser callback to cover readlinePort.question branch
    const askUserPort = extractAskUser(runLintFixer);
    if (askUserPort) {
      const answer = await askUserPort.askUser(ASK_USER_PROMPT);
      expect(answer).toBe("user answer");
      expect(readlinePort.question).toHaveBeenCalledWith(ASK_USER_PROMPT);
    }
  });

  it("covers null summary fallback in questioner artifact", async () => {
    const { executeOrchestrator } = await import("../engine/orchestrator.ts");

    const claude = makeClaudeAdapter();
    const git = makeGitAdapter();

    const result = await executeOrchestrator(
      {
        claudeAdapter: claude,
        config: defaultPipelineConfig,
        gitAdapter: git,
        questionerRunner: nullSummaryRunner,
      },
      undefined,
      "run-null-summary",
    );

    expect(result.success).toBe(true);
  });
});

describe("Orchestrator failure branches", () => {
  it("stage execution failure returns false (line 388)", async () => {
    const { executeOrchestrator } = await import("../engine/orchestrator.ts");
    const { executeDebateModerator } =
      await import("../stages/debate-moderator.ts");

    // Make stage 2 (DebateModerator) fail
    vi.mocked(executeDebateModerator).mockResolvedValueOnce({
      success: false,
    });

    const claude = makeClaudeAdapter();
    const git = makeGitAdapter();
    const result = await executeOrchestrator(
      {
        claudeAdapter: claude,
        config: defaultPipelineConfig,
        gitAdapter: git,
        questionerRunner,
      },
      undefined,
      "run-stage-fail",
    );

    expect(result.success).toBe(false);
  });

  it("streaming stage failure returns failed (line 533)", async () => {
    const { executeOrchestrator } = await import("../engine/orchestrator.ts");
    const { executeStreamingConfirmation } =
      await import("../stages/implementation-planning.ts");

    // Make streaming confirmation set the stage status to "failed"
    vi.mocked(executeStreamingConfirmation).mockImplementationOnce(
      async (_adapter, store, _maxStreamTurns) => {
        await Promise.resolve();
        store.failCurrentStage("stream_limit_exceeded");
        return { turns: 0 };
      },
    );

    const claude = makeClaudeAdapter();
    const git = makeGitAdapter();
    const result = await executeOrchestrator(
      {
        claudeAdapter: claude,
        config: defaultPipelineConfig,
        gitAdapter: git,
        questionerRunner,
      },
      undefined,
      "run-streaming-fail",
    );

    expect(result.success).toBe(false);
  });
});
