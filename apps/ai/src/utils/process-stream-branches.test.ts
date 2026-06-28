import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockState = { messages: [] };
vi.mock("../stores/chat-store.js", () => {
  return {
    chatStore: {
      messagesReference: [],
      state: mockState,
      update: vi.fn((updater: (draft: { messages: unknown[] }) => void) => {
        updater(mockState);
      })
    }
  };
});

function resetMockState(): void {
  mockState.messages = [];
}

vi.mock("./chat-logger.js", () => {
  return {
    logChatMessage: vi.fn()
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

const FIRST_TEXT = "First text";

async function* textMessageContentGenerator(): AsyncGenerator<{
  [key: string]: unknown;
  type: string;
}> {
  yield {
    delta: FIRST_TEXT,
    type: "TEXT_MESSAGE_CONTENT"
  };
}

async function* toolCallArgumentsGenerator(): AsyncGenerator<{
  [key: string]: unknown;
  type: string;
}> {
  yield {
    args: '{"a":1}',
    toolCallId: null,
    type: "TOOL_CALL_ARGS"
  };
}

async function* toolCallResultGenerator(): AsyncGenerator<{
  [key: string]: unknown;
  type: string;
}> {
  yield {
    content: "result",
    toolName: 42,
    type: "TOOL_CALL_RESULT"
  };
}

async function* toolCallStartGenerator(): AsyncGenerator<{
  [key: string]: unknown;
  type: string;
}> {
  yield {
    toolCallId: 123,
    toolName: undefined,
    type: "TOOL_CALL_START"
  };
}

async function* unknownChunkGenerator(): AsyncGenerator<{
  [key: string]: unknown;
  type: string;
}> {
  yield {
    type: "UNKNOWN_CHUNK_TYPE"
  };
}

describe("processStream branch coverage", () => {
  it("handles TOOL_CALL_START with non-string toolName and toolCallId", async () => {
    resetMockState();
    const { processStream } = await import("./process-stream.js");
    const chatStoreModule = await import("../stores/chat-store.js");
    const chatStore = chatStoreModule.chatStore as unknown as {
      state: { messages: unknown[] };
      update: ReturnType<typeof vi.fn>;
    };
    // Set up a mock that actually calls the updater to exercise the callback body
    chatStore.update = vi.fn(
      (updater: (draft: { messages: unknown[] }) => void) => {
        updater(chatStore.state);
      }
    );
    chatStore.state.messages = [];

    await processStream(
      toolCallStartGenerator() as AsyncIterable<{
        [key: string]: unknown;
        type: string;
      }>
    );

    expect(chatStore.update).toHaveBeenCalledOnce();
    // Verify that a tool_call message was pushed to state
    expect(chatStore.state.messages).toHaveLength(1);
    const message = chatStore.state.messages[0] as Record<string, unknown>;
    expect(message["type"]).toBe("tool_call");
  });

  it("handles TOOL_CALL_ARGS with non-string toolCallId and exercises update callback", async () => {
    resetMockState();
    const { processStream } = await import("./process-stream.js");
    const chatStoreModule = await import("../stores/chat-store.js");
    const chatStore = chatStoreModule.chatStore as unknown as {
      state: { messages: unknown[] };
      update: ReturnType<typeof vi.fn>;
    };
    // Set up a mock that passes state to the updater
    chatStore.update = vi.fn(
      (updater: (draft: { messages: unknown[] }) => void) => {
        updater(chatStore.state);
      }
    );
    chatStore.state.messages = [
      { id: "call-1", input: {}, name: "test", output: "", type: "tool_call" }
    ];

    await processStream(
      toolCallArgumentsGenerator() as AsyncIterable<{
        [key: string]: unknown;
        type: string;
      }>
    );

    // Should still update (with empty string key)
    expect(chatStore.update).toHaveBeenCalledOnce();
  });

  it("handles TOOL_CALL_RESULT with non-string toolName and exercises update callback", async () => {
    resetMockState();
    const { processStream } = await import("./process-stream.js");
    const chatStoreModule = await import("../stores/chat-store.js");
    const chatStore = chatStoreModule.chatStore as unknown as {
      state: { messages: unknown[] };
      update: ReturnType<typeof vi.fn>;
    };
    // Set up a mock that passes state to the updater
    chatStore.update = vi.fn(
      (updater: (draft: { messages: unknown[] }) => void) => {
        updater(chatStore.state);
      }
    );
    chatStore.state.messages = [
      { id: "call-1", input: {}, name: "test", output: "", type: "tool_call" }
    ];

    await processStream(
      toolCallResultGenerator() as AsyncIterable<{
        [key: string]: unknown;
        type: string;
      }>
    );

    expect(chatStore.update).toHaveBeenCalledOnce();
  });

  it("handles TEXT_MESSAGE_CONTENT with existing assistant message (0 <= lastAssistantIndex branch)", async () => {
    resetMockState();
    const { processStream } = await import("./process-stream.js");
    const chatStoreModule = await import("../stores/chat-store.js");
    const chatStore = chatStoreModule.chatStore as unknown as {
      state: { messages: unknown[] };
      update: ReturnType<typeof vi.fn>;
    };
    // Set up a mock that passes state to the updater
    chatStore.update = vi.fn(
      (updater: (draft: { messages: unknown[] }) => void) => {
        updater(chatStore.state);
      }
    );
    // Pre-populate with an assistant message so the finder finds it
    chatStore.state.messages = [
      { content: "existing", role: "assistant", type: "message" }
    ];

    const result = await processStream(
      textMessageContentGenerator() as AsyncIterable<{
        [key: string]: unknown;
        type: string;
      }>
    );

    expect(result).toBe(FIRST_TEXT);
    expect(chatStore.update).toHaveBeenCalledOnce();
  });

  it("handles unknown chunk type gracefully", async () => {
    const { processStream } = await import("./process-stream.js");
    const chatStoreModule = await import("../stores/chat-store.js");
    const chatStore = chatStoreModule.chatStore as unknown as {
      update: ReturnType<typeof vi.fn>;
    };
    chatStore.update = vi.fn();

    const result = await processStream(
      unknownChunkGenerator() as AsyncIterable<{
        [key: string]: unknown;
        type: string;
      }>
    );

    expect(result).toBe("");
    expect(chatStore.update).not.toHaveBeenCalled();
  });

  it("handles TEXT_MESSAGE_CONTENT with non-matching messages (covers condition short-circuits at line 101)", async () => {
    resetMockState();
    const { processStream } = await import("./process-stream.js");
    const chatStoreModule = await import("../stores/chat-store.js");
    const chatStore = chatStoreModule.chatStore as unknown as {
      state: { messages: unknown[] };
      update: ReturnType<typeof vi.fn>;
    };
    chatStore.update = vi.fn(
      (updater: (draft: { messages: unknown[] }) => void) => {
        updater(chatStore.state);
      }
    );
    // Messages that fail each sub-condition of the if at line 101:
    // null fails the !isNil check, tool_call fails type check, user message fails role check
    chatStore.state.messages = [
      null,
      { name: "test", type: "tool_call" },
      { content: "user msg", role: "user", type: "message" }
    ];

    const result = await processStream(
      textMessageContentGenerator() as AsyncIterable<{
        [key: string]: unknown;
        type: string;
      }>
    );

    expect(result).toBe(FIRST_TEXT);
    expect(chatStore.update).toHaveBeenCalledOnce();
    // No assistant was found, so a new message is pushed (the else branch at line 121)
    expect(chatStore.state.messages).toHaveLength(4);
  });

  it("handles TEXT_MESSAGE_CONTENT with no existing assistant message (push path)", async () => {
    resetMockState();
    const { processStream } = await import("./process-stream.js");
    const chatStoreModule = await import("../stores/chat-store.js");
    const chatStore = chatStoreModule.chatStore as unknown as {
      state: { messages: unknown[] };
      update: ReturnType<typeof vi.fn>;
    };
    // Set up a mock that passes state to the updater so the else branch executes
    chatStore.update = vi.fn(
      (updater: (draft: { messages: unknown[] }) => void) => {
        updater(chatStore.state);
      }
    );
    chatStore.state.messages = [];

    const result = await processStream(
      textMessageContentGenerator() as AsyncIterable<{
        [key: string]: unknown;
        type: string;
      }>
    );

    expect(result).toBe(FIRST_TEXT);
    expect(chatStore.update).toHaveBeenCalledOnce();
    // Verify the message was pushed to state
    expect(chatStore.state.messages).toHaveLength(1);
    const message = chatStore.state.messages[0] as Record<string, unknown>;
    expect(message["role"]).toBe("assistant");
  });
});
