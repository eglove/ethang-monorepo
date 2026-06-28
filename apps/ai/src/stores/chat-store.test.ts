import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { chatStore } from "./chat-store.js";

describe("chat-store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    chatStore.resetToWelcome();
    chatStore.exitCallback = undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("reset", () => {
    it("clears messagesReference and resets messages to the welcome message", () => {
      chatStore.update((draft) => {
        draft.messages.push({
          content: "Hello",
          role: "user",
          type: "message"
        } as any);
      });

      chatStore.reset();

      expect(chatStore.messagesReference).toHaveLength(0);
      expect(chatStore.state.messages).toHaveLength(1);
      expect(chatStore.state.messages[0]).toEqual({
        content:
          "Welcome to the AI planning harness. What would you like to build?",
        id: expect.any(String),
        role: "assistant",
        type: "message"
      });
    });
  });
});
