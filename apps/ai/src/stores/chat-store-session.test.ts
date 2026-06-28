import filter from "lodash/filter.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const adapter = { id: "adapter" };
const clients: never[] = [];
const mcpClient1 = { close: vi.fn().mockResolvedValue(undefined) };

vi.mock("../providers/openrouter.js", () => {
  return {
    createOpenRouterAdapter: vi.fn().mockReturnValue(adapter)
  };
});

vi.mock("../utils/chat-logger.js", () => {
  return {
    logChatMessage: vi.fn().mockResolvedValue(undefined)
  };
});

vi.mock("../utils/make-ui-message.js", () => {
  return {
    makeUIMessage: vi
      .fn()
      .mockImplementation((role: string, content: string) => {
        return {
          content,
          id: `ui-${role}-${content}`,
          parts: [{ content, type: "text" }],
          role
        };
      })
  };
});

vi.mock("../utils/parse-plan-sections.js", () => {
  return {
    parsePlanSections: vi.fn().mockReturnValue([{ content: "C", title: "T" }])
  };
});

vi.mock("../utils/write-plan.js", () => {
  return {
    writePlan: vi.fn().mockResolvedValue({
      jsonPath: "plan.json",
      markdownPath: "plan.md"
    })
  };
});

vi.mock("../environment.js", () => {
  return {
    PLAN_OUTPUT_PATH: "plan.md"
  };
});

const getMCPClientsMock = vi.fn().mockResolvedValue(clients);
vi.mock("./mcp-clients.js", () => {
  return {
    getMCPClients: getMCPClientsMock
  };
});

vi.mock("./chat-constants.js", () => {
  return {
    CONTINUE_NUDGE: "continue",
    GRILL_NUDGE: "grill",
    SYSTEM_PROMPT: "system"
  };
});

vi.mock("@tanstack/ai", () => {
  return {
    chat: vi.fn().mockReturnValue((async function* () {})()),
    maxIterations: vi.fn().mockReturnValue({})
  };
});

// Mock processStream and closeClients — control return values per-test
const processStreamMock = vi.fn().mockResolvedValue("");
const closeClientsMock = vi.fn().mockResolvedValue(undefined);
const isPlanCompleteMock = vi.fn().mockReturnValue(false);

vi.mock("../utils/process-stream.js", () => {
  return {
    closeClients: closeClientsMock,
    processStream: processStreamMock
  };
});

vi.mock("../utils/is-plan-complete.js", () => {
  return {
    isPlanComplete: isPlanCompleteMock
  };
});

const { chatStore } = await import("./chat-store.js");

describe("chatStore runChatSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    chatStore.resetToWelcome();
    chatStore.exitCallback = undefined;
    vi.clearAllMocks();
    processStreamMock.mockResolvedValue("");
    isPlanCompleteMock.mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("pushes user message and triggers runChatSession", async () => {
    const promise = chatStore.sendMessage("Hello");
    await Promise.resolve();
    expect(chatStore.state.isLoading).toBe(true);
    await promise;
    expect(chatStore.state.isLoading).toBe(false);
  });

  it("loops with CONTINUE_NUDGE when content is not a plan and does not end with ?", async () => {
    // First call returns non-plan content, second returns empty (loop exits)
    processStreamMock
      .mockResolvedValueOnce("Some partial answer")
      .mockResolvedValueOnce("");

    isPlanCompleteMock.mockReturnValue(false);

    const promise = chatStore.sendMessage("Build something");
    await Promise.resolve();
    await promise;

    // Should have called processStream at least twice (initial + 1 retry)
    expect(processStreamMock).toHaveBeenCalledTimes(2);
    // isPlanComplete should have been called
    expect(isPlanCompleteMock).toHaveBeenCalled();
  });

  it("breaks the loop when content ends with ?", async () => {
    processStreamMock.mockResolvedValueOnce("Do you prefer A or B?");
    isPlanCompleteMock.mockReturnValue(false);

    const promise = chatStore.sendMessage("Question");
    await Promise.resolve();
    await promise;

    // Should only call processStream once (loop breaks on ?)
    expect(processStreamMock).toHaveBeenCalledTimes(1);
  });

  it("writes a plan when content is complete", async () => {
    processStreamMock.mockResolvedValueOnce("# Plan\n\n## Section\n\nDetails.");
    // Return true for both the loop condition check AND the plan-write condition
    isPlanCompleteMock.mockReturnValue(true);

    const promise = chatStore.sendMessage("Final");
    await Promise.resolve();
    await promise;

    const { writePlan } = await import("../utils/write-plan.js");
    expect(writePlan).toHaveBeenCalledOnce();
  });

  it("does NOT push GRILL_NUDGE when not the first user message", async () => {
    // First send to establish a user message in state
    const first = chatStore.sendMessage("First message");
    await Promise.resolve();
    await first;

    // Now send a second message - isFirstUserMessage should be false
    const { makeUIMessage } = await import("../utils/make-ui-message.js");
    const second = chatStore.sendMessage("Second message");
    await Promise.resolve();
    await second;

    // GRILL_NUDGE should only have been pushed once (for the first message),
    // not for the second. With 2 sends, makeUIMessage should have been called
    // for each UI message: user/first, user/grill, user/second
    expect(makeUIMessage).toHaveBeenCalledTimes(3);
  });

  it("passes MCP option when clients are present", async () => {
    getMCPClientsMock.mockResolvedValue([mcpClient1]);

    const promise = chatStore.sendMessage("With MCP");
    await Promise.resolve();
    await promise;

    const { chat } = await import("@tanstack/ai");
    expect(chat).toHaveBeenCalledOnce();
    const chatOptions = (chat as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    // The mcp option should be present when clients are available
    expect(chatOptions?.mcp).toBeDefined();
    expect(chatOptions?.mcp?.clients).toHaveLength(1);
  });

  it("handles error from processStream via Effect.catchAll", async () => {
    processStreamMock.mockRejectedValueOnce(new Error("stream failed"));

    // sendMessage should NOT reject because Effect.catchAll handles the error
    await chatStore.sendMessage("Fail");

    // The catchAll handler should have pushed a system message with the error
    expect(chatStore.state.isLoading).toBe(false);
    const systemMessages = filter(chatStore.state.messages, (m) => {
      return "system" === m.type;
    });
    expect(systemMessages.length).toBeGreaterThan(0);
    expect(processStreamMock).toHaveBeenCalled();
  });
});
