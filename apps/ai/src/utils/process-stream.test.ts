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

async function* emptyArgumentsGenerator(): AsyncGenerator<{
  [key: string]: unknown;
  type: string;
}> {
  yield { args: "", toolCallId: "call-3", type: "TOOL_CALL_ARGS" };
  yield { args: 123, toolCallId: "call-3", type: "TOOL_CALL_ARGS" };
}

async function* fullMixedGenerator(): AsyncGenerator<{
  [key: string]: unknown;
  type: string;
}> {
  yield { delta: "Let me ", type: "TEXT_MESSAGE_CONTENT" };
  yield { toolCallId: "call-4", toolName: "search", type: "TOOL_CALL_START" };
  yield {
    args: '{"query": "auth"}',
    toolCallId: "call-4",
    type: "TOOL_CALL_ARGS"
  };
  yield {
    content: ["result 1", "result 2"],
    toolName: "search",
    type: "TOOL_CALL_RESULT"
  };
  yield { delta: " investigate.", type: "TEXT_MESSAGE_CONTENT" };
}

async function* nonStringDeltaGenerator(): AsyncGenerator<{
  [key: string]: unknown;
  type: string;
}> {
  yield { delta: 42, type: "TEXT_MESSAGE_CONTENT" };
  yield { delta: "", type: "TEXT_MESSAGE_CONTENT" };
  yield { delta: "valid", type: "TEXT_MESSAGE_CONTENT" };
}

async function* singleDeltaGenerator(): AsyncGenerator<{
  [key: string]: unknown;
  type: string;
}> {
  yield { delta: "Done", type: "TEXT_MESSAGE_CONTENT" };
}

async function* textMessageGenerator(): AsyncGenerator<{
  [key: string]: unknown;
  type: string;
}> {
  yield { delta: "Hello", type: "TEXT_MESSAGE_CONTENT" };
  yield { delta: " world", type: "TEXT_MESSAGE_CONTENT" };
}

async function* toolCallArgumentsGenerator2(): AsyncGenerator<{
  [key: string]: unknown;
  type: string;
}> {
  yield {
    toolCallId: "call-2",
    toolName: "read_file",
    type: "TOOL_CALL_START"
  };
  yield { args: '{"path": "', toolCallId: "call-2", type: "TOOL_CALL_ARGS" };
  yield {
    args: 'src/index.ts"}',
    toolCallId: "call-2",
    type: "TOOL_CALL_ARGS"
  };
}

async function* toolCallResultGenerator2(): AsyncGenerator<{
  [key: string]: unknown;
  type: string;
}> {
  yield {
    content: "tool output here",
    toolName: "read_file",
    type: "TOOL_CALL_RESULT"
  };
}

async function* toolCallStartGenerator2(): AsyncGenerator<{
  [key: string]: unknown;
  type: string;
}> {
  yield {
    toolCallId: "call-1",
    toolName: "search_files",
    type: "TOOL_CALL_START"
  };
}

describe("processStream", () => {
  it("returns empty string for an empty stream", async () => {
    const { processStream } = await import("./process-stream.js");
    const chatStoreModule = await import("../stores/chat-store.js");
    const chatStore = chatStoreModule.chatStore as unknown as {
      update: ReturnType<typeof vi.fn>;
    };
    chatStore.update = vi.fn();

    const result = await processStream(
      (async function* () {})() as AsyncIterable<{
        [key: string]: unknown;
        type: string;
      }>
    );

    expect(result).toBe("");
    expect(chatStore.update).not.toHaveBeenCalled();
  });

  it("accumulates TEXT_MESSAGE_CONTENT deltas into returned string", async () => {
    const { processStream } = await import("./process-stream.js");

    const result = await processStream(
      textMessageGenerator() as AsyncIterable<{
        [key: string]: unknown;
        type: string;
      }>
    );

    expect(result).toBe("Hello world");
  });

  it("ignores non-string or empty deltas", async () => {
    const { processStream } = await import("./process-stream.js");

    const result = await processStream(
      nonStringDeltaGenerator() as AsyncIterable<{
        [key: string]: unknown;
        type: string;
      }>
    );

    expect(result).toBe("valid");
  });

  it("pushes final content to messagesReference when content is non-empty", async () => {
    const { processStream } = await import("./process-stream.js");
    const chatStoreModule = await import("../stores/chat-store.js");

    const chatStore = chatStoreModule.chatStore as unknown as {
      messagesReference: unknown[];
    };
    chatStore.messagesReference = [];

    const result = await processStream(
      singleDeltaGenerator() as AsyncIterable<{
        [key: string]: unknown;
        type: string;
      }>
    );

    expect(result).toBe("Done");
    expect(chatStore.messagesReference).toHaveLength(1);
    const pushed = chatStore.messagesReference[0] as {
      parts: unknown[];
      role: string;
    };
    expect(pushed.role).toBe("assistant");
    expect(pushed.parts).toEqual([{ content: "Done", type: "text" }]);
  });

  it("handles TOOL_CALL_START by resetting args and updating messages", async () => {
    const { processStream } = await import("./process-stream.js");
    const chatStoreModule = await import("../stores/chat-store.js");

    const chatStore = chatStoreModule.chatStore as unknown as {
      update: ReturnType<typeof vi.fn>;
    };
    chatStore.update = vi.fn();

    await processStream(
      toolCallStartGenerator2() as AsyncIterable<{
        [key: string]: unknown;
        type: string;
      }>
    );

    expect(chatStore.update).toHaveBeenCalledOnce();
  });

  it("accumulates TOOL_CALL_ARGS and updates tool call input", async () => {
    const { processStream } = await import("./process-stream.js");
    const chatStoreModule = await import("../stores/chat-store.js");

    const chatStore = chatStoreModule.chatStore as unknown as {
      update: ReturnType<typeof vi.fn>;
    };
    chatStore.update = vi.fn();

    await processStream(
      toolCallArgumentsGenerator2() as AsyncIterable<{
        [key: string]: unknown;
        type: string;
      }>
    );

    expect(chatStore.update).toHaveBeenCalledTimes(3);
  });

  it("ignores TOOL_CALL_ARGS with non-string or empty args", async () => {
    const { processStream } = await import("./process-stream.js");
    const chatStoreModule = await import("../stores/chat-store.js");

    const chatStore = chatStoreModule.chatStore as unknown as {
      update: ReturnType<typeof vi.fn>;
    };
    chatStore.update = vi.fn();

    await processStream(
      emptyArgumentsGenerator() as AsyncIterable<{
        [key: string]: unknown;
        type: string;
      }>
    );

    expect(chatStore.update).not.toHaveBeenCalled();
  });

  it("handles TOOL_CALL_RESULT by updating tool call output", async () => {
    const { processStream } = await import("./process-stream.js");
    const chatStoreModule = await import("../stores/chat-store.js");

    const chatStore = chatStoreModule.chatStore as unknown as {
      update: ReturnType<typeof vi.fn>;
    };
    chatStore.update = vi.fn();

    await processStream(
      toolCallResultGenerator2() as AsyncIterable<{
        [key: string]: unknown;
        type: string;
      }>
    );

    expect(chatStore.update).toHaveBeenCalledOnce();
  });

  it("updates existing assistant message in place when index is set", async () => {
    const { processStream } = await import("./process-stream.js");
    const chatStoreModule = await import("../stores/chat-store.js");

    const chatStore = chatStoreModule.chatStore as unknown as {
      messagesReference: unknown[];
      update: ReturnType<typeof vi.fn>;
    };
    chatStore.messagesReference = [];
    // Execute the updater so setCurrentAssistantIndex is called
    chatStore.update.mockImplementation(
      (updater: (draft: { messages: { length: number }[] }) => void) => {
        const draft = { messages: [] };
        updater(draft);
      }
    );

    // Two text deltas => second one hits the currentAssistantIndex >= 0 branch
    const result = await processStream(
      textMessageGenerator() as AsyncIterable<{
        [key: string]: unknown;
        type: string;
      }>
    );

    expect(result).toBe("Hello world");
    expect(chatStore.messagesReference).toHaveLength(1);
  });

  it("handles a full mixed stream correctly", async () => {
    const { processStream } = await import("./process-stream.js");
    const chatStoreModule = await import("../stores/chat-store.js");

    const chatStore = chatStoreModule.chatStore as unknown as {
      messagesReference: unknown[];
      update: ReturnType<typeof vi.fn>;
    };
    chatStore.messagesReference = [];
    chatStore.update = vi.fn();

    const result = await processStream(
      fullMixedGenerator() as AsyncIterable<{
        [key: string]: unknown;
        type: string;
      }>
    );

    // 2 TEXT_MESSAGE_CONTENT + 1 TOOL_CALL_START + 1 TOOL_CALL_ARGS + 1 TOOL_CALL_RESULT = 5 chatStore.update calls
    expect(result).toBe("Let me  investigate.");
    expect(chatStore.messagesReference).toHaveLength(1);
    expect(chatStore.update).toHaveBeenCalledTimes(5);
  });
});

describe("closeClients", () => {
  it("calls close on every client", async () => {
    const { closeClients } = await import("./process-stream.js");

    const client1 = { close: vi.fn().mockResolvedValue(undefined) };
    const client2 = { close: vi.fn().mockResolvedValue(undefined) };

    await closeClients([client1, client2] as unknown as never[]);

    expect(client1.close).toHaveBeenCalledOnce();
    expect(client2.close).toHaveBeenCalledOnce();
  });

  it("handles an empty array without errors", async () => {
    const { closeClients } = await import("./process-stream.js");

    await expect(closeClients([])).resolves.toBeUndefined();
  });
});
