import { describe, expect, it, type MockInstance, vi } from "vitest";

import { ClaudeSdkAdapter } from "./claude-sdk.ts";

function createMockMessage(text: string) {
  return {
    content: [{ text, type: "text" as const }],
    id: "msg_test",
    model: "claude-sonnet-4-20250514",
    role: "assistant" as const,
    stop_reason: "end_turn" as const,
    stop_sequence: null,
    type: "message" as const,
    usage: { input_tokens: 10, output_tokens: 20 },
  };
}

function mockCreate(adapter: ClaudeSdkAdapter, mockFunction: MockInstance) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- mocking private readonly property
  const adapterRecord = adapter as unknown as Record<
    string,
    { messages: { create: MockInstance; stream: MockInstance } }
  >;
  adapterRecord["client"] = {
    messages: { create: mockFunction, stream: mockFunction },
  };
}

describe("ClaudeSdkAdapter", () => {
  it("executePrompt returns text on success", async () => {
    const adapter = new ClaudeSdkAdapter();
    const createFunction = vi
      .fn()
      .mockResolvedValue(createMockMessage("hello"));
    mockCreate(adapter, createFunction);

    const result = await adapter.executePrompt("test prompt");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe("hello");
    }
  });

  it("executePrompt joins multiple text blocks", async () => {
    const adapter = new ClaudeSdkAdapter();
    const message = {
      ...createMockMessage("first"),
      content: [
        { text: "first", type: "text" as const },
        { text: "second", type: "text" as const },
      ],
    };
    mockCreate(adapter, vi.fn().mockResolvedValue(message));

    const result = await adapter.executePrompt("test");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe("first\nsecond");
    }
  });

  it("executePrompt returns error on API failure", async () => {
    const adapter = new ClaudeSdkAdapter();
    mockCreate(adapter, vi.fn().mockRejectedValue(new Error("timeout error")));

    const result = await adapter.executePrompt("test");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorKind).toBe("claude_api_timeout");
    }
  });

  it("streamPrompt returns text on success", async () => {
    const adapter = new ClaudeSdkAdapter();
    const streamObject = {
      finalMessage: vi.fn().mockResolvedValue(createMockMessage("streamed")),
    };
    mockCreate(adapter, vi.fn().mockReturnValue(streamObject));

    const result = await adapter.streamPrompt("test");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe("streamed");
    }
  });

  it("streamPrompt returns error on stream failure", async () => {
    const adapter = new ClaudeSdkAdapter();
    const streamObject = {
      finalMessage: vi.fn().mockRejectedValue(new Error("rate limited")),
    };
    mockCreate(adapter, vi.fn().mockReturnValue(streamObject));

    const result = await adapter.streamPrompt("test");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorKind).toBe("claude_api_rate_limit");
    }
  });

  it("routePairMessage delegates to executePrompt", async () => {
    const adapter = new ClaudeSdkAdapter();
    mockCreate(adapter, vi.fn().mockResolvedValue(createMockMessage("pair")));

    const result = await adapter.routePairMessage("test");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe("pair");
    }
  });

  it("mapError classifies rate limit errors", () => {
    const adapter = new ClaudeSdkAdapter();
    const result = adapter.mapError(new Error("rate limit exceeded"));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorKind).toBe("claude_api_rate_limit");
    }
  });

  it("mapError classifies timeout errors", () => {
    const adapter = new ClaudeSdkAdapter();
    const result = adapter.mapError(new Error("ETIMEDOUT"));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorKind).toBe("claude_api_timeout");
    }
  });

  it("mapError handles non-Error values", () => {
    const adapter = new ClaudeSdkAdapter();
    const result = adapter.mapError("something broke");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorKind).toBe("claude_api_timeout");
    }
  });

  it("uses custom model and maxTokens from config", async () => {
    const adapter = new ClaudeSdkAdapter({
      maxTokens: 4096,
      model: "claude-haiku-4-5-20251001",
    });
    const createFunction = vi
      .fn()
      .mockResolvedValue(createMockMessage("custom"));
    mockCreate(adapter, createFunction);

    await adapter.executePrompt("test");

    expect(createFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        max_tokens: 4096,
        model: "claude-haiku-4-5-20251001",
      }),
    );
  });
});
