import { describe, expect, it } from "vitest";

import { LlmState } from "../util/enums.ts";
import { isOk, isResultError } from "../util/result.ts";
import {
  createTestOpenRouterStore,
  OpenRouterStore,
} from "./open-router-store.ts";

describe("OpenRouterStore", () => {
  describe("initial state", () => {
    it("has idle llmState", () => {
      const store = new OpenRouterStore();
      expect(store.state.llmState).toBe(LlmState.Idle);
    });

    it("has default timeout", () => {
      const store = new OpenRouterStore();
      expect(store.state.timeoutMs).toBe(120_000);
    });
  });

  describe("getModel", () => {
    it("returns configured model for known stage", () => {
      const store = new OpenRouterStore({ questioner: "test/model" });
      expect(store.getModel("questioner")).toBe("test/model");
    });

    it("returns default model for unknown stage", () => {
      const store = new OpenRouterStore();
      expect(store.getModel("unknown-stage")).toBe(
        "anthropic/claude-sonnet-4-20250514",
      );
    });
  });

  describe("chat (base implementation)", () => {
    it("returns not-implemented error", async () => {
      const store = new OpenRouterStore();
      const result = await store.chat({
        messages: [{ content: "hi", role: "user" }],
        model: "test",
      });
      expect(isResultError(result)).toBe(true);
    });
  });

  describe("destroy", () => {
    it("destroys without error", () => {
      const store = new OpenRouterStore();
      store.destroy();
      expect(store.destroyed).toBe(true);
    });
  });
});

describe("createTestOpenRouterStore", () => {
  it("simulateStream provides controlled token emission", async () => {
    const { simulateStream, store } = createTestOpenRouterStore();
    simulateStream(["hello", " world"]);

    const result = await store.chat({
      messages: [{ content: "test", role: "user" }],
      model: "test",
    });
    expect(isOk(result)).toBe(true);

    if (isOk(result)) {
      const tokens: string[] = [];
      for await (const chunk of result.value) {
        tokens.push(chunk.content);
      }

      expect(tokens).toStrictEqual(["hello", " world", ""]);
    }
  });

  it("simulateError provides failure injection", async () => {
    const { simulateError, store } = createTestOpenRouterStore();
    simulateError("timeout");

    const result = await store.chat({
      messages: [{ content: "test", role: "user" }],
      model: "test",
    });
    expect(isResultError(result)).toBe(true);
  });
});
