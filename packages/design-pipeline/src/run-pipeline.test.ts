/* eslint-disable max-classes-per-file -- test mocks require separate class declarations for vi.mock with new */
import constant from "lodash/constant.js";
import isFunction from "lodash/isFunction.js";
import isObject from "lodash/isObject.js";
import { describe, expect, it, vi } from "vitest";

import { defaultPipelineConfig } from "./constants.ts";

type EslintRunner = {
  fix: (filePath: string) => { clean: boolean; errors: string };
};

type ReadlinePort = {
  close: () => void;
  question: (prompt: string) => Promise<string>;
};

const mockClaudeAdapter = {
  executePrompt: vi.fn().mockResolvedValue({ data: {}, ok: true }),
  routePairMessage: vi.fn().mockResolvedValue({ data: {}, ok: true }),
  streamPrompt: vi.fn().mockResolvedValue({ data: {}, ok: true }),
};

const mockGitAdapter = {
  acquireLock: vi.fn().mockReturnValue(true),
  checkout: vi.fn().mockResolvedValue({ ok: true }),
  commit: vi.fn().mockResolvedValue({ ok: true }),
  createBranch: vi.fn().mockResolvedValue({ ok: true }),
  getCurrentBranch: vi.fn().mockResolvedValue("main"),
  push: vi.fn().mockResolvedValue({ ok: true }),
  releaseLock: vi.fn(),
};

class MockClaudeSdkAdapter {
  public executePrompt = mockClaudeAdapter.executePrompt;
  public routePairMessage = mockClaudeAdapter.routePairMessage;
  public streamPrompt = mockClaudeAdapter.streamPrompt;
}

vi.mock("./adapters/claude-sdk.ts", () => {
  return {
    ClaudeSdkAdapter: MockClaudeSdkAdapter,
  };
});

vi.mock("./adapters/git-child-process.ts", () => {
  return {
    ChildProcessGitAdapter: class MockChildProcessGitAdapter {
      public acquireLock = mockGitAdapter.acquireLock;
      public checkout = mockGitAdapter.checkout;
      public commit = mockGitAdapter.commit;
      public createBranch = mockGitAdapter.createBranch;
      public getCurrentBranch = mockGitAdapter.getCurrentBranch;
      public push = mockGitAdapter.push;
      public releaseLock = mockGitAdapter.releaseLock;
    },
  };
});

const mockRlQuestion = vi
  .fn()
  .mockImplementation((_prompt: string, callback: (answer: string) => void) => {
    callback("test answer");
  });
const mockRlClose = vi.fn();

vi.mock("node:readline", () => {
  return {
    createInterface: vi.fn().mockReturnValue({
      close: mockRlClose,
      question: mockRlQuestion,
    }),
  };
});

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      public messages = { create: vi.fn() };
    },
  };
});

vi.mock("node:child_process", () => {
  return {
    execFileSync: vi.fn(),
  };
});

vi.mock("./stages/questioner-session.ts", () => {
  return {
    runQuestionerSession: vi.fn().mockResolvedValue({ complete: true }),
  };
});

let capturedDeps: Record<string, unknown>;

vi.mock("./engine/orchestrator.ts", async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    executeOrchestrator: vi
      .fn()
      // eslint-disable-next-line @typescript-eslint/require-await -- mock factory does not need real async
      .mockImplementation(async (deps: Record<string, unknown>) => {
        capturedDeps = deps;
        return {
          artifacts: {},
          state: { state: "completed" },
          success: true,
        };
      }),
  };
});

function assertEslintRunner(value: unknown): EslintRunner {
  if (isObject(value) && "fix" in value) {
    // @ts-expect-error -- test assertion narrows unknown to EslintRunner
    return value;
  }
  throw new Error("Expected EslintRunner");
}

function assertQuestionerRunner(
  value: unknown,
): (deps: Record<string, unknown>) => Promise<unknown> {
  if (isFunction(value)) {
    return value;
  }
  throw new Error("Expected QuestionerRunner");
}

function assertReadlinePort(value: unknown): ReadlinePort {
  if (isObject(value) && "close" in value && "question" in value) {
    // @ts-expect-error -- test assertion narrows unknown to ReadlinePort
    return value;
  }
  throw new Error("Expected ReadlinePort");
}

describe("runPipeline", () => {
  it("creates real adapters and delegates to executeOrchestrator", async () => {
    const { runPipeline } = await import("./index.ts");
    const { executeOrchestrator } = await import("./engine/orchestrator.ts");

    const result = await runPipeline();

    expect(result).toEqual({
      artifacts: {},
      state: { state: "completed" },
      success: true,
    });

    expect(executeOrchestrator).toHaveBeenCalledOnce();
    const anyObject: unknown = expect.any(Object);
    expect(executeOrchestrator).toHaveBeenCalledWith(
      expect.objectContaining({
        claudeAdapter: anyObject,
        config: defaultPipelineConfig,
        gitAdapter: anyObject,
      }),
    );
  });

  it("readlinePort.question wraps rl.question as a promise", async () => {
    const { runPipeline } = await import("./index.ts");
    await runPipeline();

    const readlinePort = assertReadlinePort(capturedDeps["readlinePort"]);

    const answer = await readlinePort.question("test prompt");
    expect(answer).toBe("test answer");
    expect(mockRlQuestion).toHaveBeenCalledWith(
      "test prompt",
      expect.any(Function),
    );
  });

  it("readlinePort.close delegates to rl.close", async () => {
    const { runPipeline } = await import("./index.ts");
    await runPipeline();

    const readlinePort = assertReadlinePort(capturedDeps["readlinePort"]);

    readlinePort.close();
    expect(mockRlClose).toHaveBeenCalled();
  });

  it("eslintRunner.fix returns clean on success", async () => {
    const { runPipeline } = await import("./index.ts");
    await runPipeline();

    const eslintRunner = assertEslintRunner(capturedDeps["eslintRunner"]);

    const result = eslintRunner.fix("test-file.ts");
    expect(result).toEqual({ clean: true, errors: "" });
  });

  it("eslintRunner.fix returns errors on failure", async () => {
    const childProcess = await import("node:child_process");
    vi.mocked(childProcess.execFileSync).mockImplementation(() => {
      throw new Error("lint failed");
    });

    const { runPipeline } = await import("./index.ts");
    await runPipeline();

    const eslintRunner = assertEslintRunner(capturedDeps["eslintRunner"]);

    const result = eslintRunner.fix("bad-file.ts");
    expect(result).toEqual({ clean: false, errors: "lint failed" });

    vi.mocked(childProcess.execFileSync).mockImplementation(constant(""));
  });

  it("eslintRunner.fix handles non-Error throw", async () => {
    const childProcess = await import("node:child_process");
    vi.mocked(childProcess.execFileSync).mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- testing non-Error throw
      throw "string error";
    });

    const { runPipeline } = await import("./index.ts");
    await runPipeline();

    const eslintRunner = assertEslintRunner(capturedDeps["eslintRunner"]);

    const result = eslintRunner.fix("bad-file.ts");
    expect(result).toEqual({ clean: false, errors: "string error" });

    vi.mocked(childProcess.execFileSync).mockImplementation(constant(""));
  });

  it("questionerRunner delegates to runQuestionerSession", async () => {
    const { runPipeline } = await import("./index.ts");
    await runPipeline("custom-topic");

    const questionerRunner = assertQuestionerRunner(
      capturedDeps["questionerRunner"],
    );

    const result = await questionerRunner({ someDep: "value" });
    expect(result).toEqual({ complete: true });

    const { runQuestionerSession } =
      await import("./stages/questioner-session.ts");
    expect(runQuestionerSession).toHaveBeenCalledWith(
      expect.objectContaining({
        someDep: "value",
        topic: "custom-topic",
      }),
    );
  });
});
