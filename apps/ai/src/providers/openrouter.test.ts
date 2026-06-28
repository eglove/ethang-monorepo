import { beforeEach, describe, expect, it, vi } from "vitest";

const createOpenaiChatCompletionsMock = vi.fn().mockReturnValue({
  id: "adapter-stub"
});

vi.mock("@tanstack/ai-openai", () => {
  return {
    createOpenaiChatCompletions: createOpenaiChatCompletionsMock
  };
});

vi.mock("../environment.ts", () => {
  return {
    OPENROUTER_API_KEY: "test-key",
    OPENROUTER_BASE_URL: "https://example.invalid/api/v1",
    OPENROUTER_MODEL: "test/model"
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createOpenRouterAdapter", () => {
  it("calls createOpenaiChatCompletions with model, key, and baseURL", async () => {
    const { createOpenRouterAdapter } = await import("./openrouter.js");

    const adapter = createOpenRouterAdapter();

    expect(createOpenaiChatCompletionsMock).toHaveBeenCalledOnce();
    expect(createOpenaiChatCompletionsMock).toHaveBeenCalledWith(
      "test/model",
      "test-key",
      { baseURL: "https://example.invalid/api/v1" }
    );
    expect(adapter).toEqual({ id: "adapter-stub" });
  });
});
