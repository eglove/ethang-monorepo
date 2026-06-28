import some from "lodash/some.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../providers/openrouter.js", () => {
  return {
    createOpenRouterAdapter: vi.fn().mockReturnValue({ id: "adapter" })
  };
});

vi.mock("../utils/process-stream.js", () => {
  return {
    closeClients: vi.fn().mockResolvedValue(undefined),
    processStream: vi.fn().mockResolvedValue("")
  };
});

vi.mock("../utils/chat-logger.js", () => {
  return {
    logChatMessage: vi.fn().mockResolvedValue(undefined)
  };
});

vi.mock("../utils/is-plan-complete.js", () => {
  return {
    isPlanComplete: vi.fn().mockReturnValue(false)
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
    parsePlanSections: vi.fn().mockReturnValue([])
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

vi.mock("./mcp-clients.js", () => {
  return {
    getMCPClients: vi.fn().mockResolvedValue([])
  };
});

vi.mock("./chat-constants.js", () => {
  return {
    CONTINUE_NUDGE: "continue",
    GRILL_NUDGE: "grill",
    SYSTEM_PROMPT: "system"
  };
});

const { chatStore } = await import("./chat-store.js");

describe("chatStore.sendMessage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    chatStore.resetToWelcome();
    chatStore.exitCallback = undefined;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("pushes user message and triggers runChatSession", async () => {
    const promise = chatStore.sendMessage("Hello");
    // Let microtasks run so isLoading gets set (it happens after the first await)
    await Promise.resolve();
    // After sendMessage, isLoading should be true and messages should include the user message
    expect(chatStore.state.isLoading).toBe(true);
    expect(
      some(chatStore.state.messages, (m) => {
        return "message" === m.type && "Hello" === m.content;
      })
    ).toBe(true);
    await promise;
    // After completion, isLoading should be reset to false
    expect(chatStore.state.isLoading).toBe(false);
  });

  it("does nothing if already loading", async () => {
    chatStore.update((draft) => {
      draft.isLoading = true;
    });
    const initialLength = chatStore.state.messages.length;
    await chatStore.sendMessage("Should be ignored");
    expect(chatStore.state.messages).toHaveLength(initialLength);
  });
});
