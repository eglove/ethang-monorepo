import { describe, expect, it } from "vitest";

import type { ChatMessage } from "../stores/chat-store.js";

import { updateToolCallInput } from "./update-tool-call-input.js";

function getToolCallMessage(
  messages: ChatMessage[],
  index: number
): Record<string, unknown> | undefined {
  const message = messages[index];
  if ("tool_call" === message?.type) {
    return message.input;
  }

  return undefined;
}

describe("updateToolCallInput", () => {
  it("updates the input of the matching tool call message", () => {
    const messages: ChatMessage[] = [
      { content: "Hello", role: "user", type: "message" },
      {
        input: { existing: true },
        name: "test_tool",
        output: "",
        type: "tool_call"
      }
    ];

    updateToolCallInput(messages, "some-id", '{"key": "value"}');

    expect(getToolCallMessage(messages, 1)).toEqual({ key: "value" });
  });

  it("does nothing when there is no tool call message", () => {
    const messages: ChatMessage[] = [
      { content: "Hello", role: "user", type: "message" }
    ];

    updateToolCallInput(messages, "some-id", '{"key": "value"}');

    expect(messages[0]).toEqual({
      content: "Hello",
      role: "user",
      type: "message"
    });
  });

  it("does nothing when accumulated is not a valid object", () => {
    const messages: ChatMessage[] = [
      { content: "Hello", role: "user", type: "message" },
      {
        input: { existing: true },
        name: "test_tool",
        output: "",
        type: "tool_call"
      }
    ];

    updateToolCallInput(messages, "some-id", '"not an object"');

    expect(getToolCallMessage(messages, 1)).toEqual({ existing: true });
  });

  it("does nothing when accumulated is null", () => {
    const messages: ChatMessage[] = [
      { content: "Hello", role: "user", type: "message" },
      {
        input: { existing: true },
        name: "test_tool",
        output: "",
        type: "tool_call"
      }
    ];

    updateToolCallInput(messages, "some-id", "null");

    expect(getToolCallMessage(messages, 1)).toEqual({ existing: true });
  });

  it("finds the last tool call message", () => {
    const messages: ChatMessage[] = [
      {
        input: { first: true },
        name: "first_tool",
        output: "",
        type: "tool_call"
      },
      { content: "Middle", role: "assistant", type: "message" },
      {
        input: { second: true },
        name: "second_tool",
        output: "",
        type: "tool_call"
      }
    ];

    updateToolCallInput(messages, "some-id", '{"updated": true}');

    expect(getToolCallMessage(messages, 2)).toEqual({ updated: true });
  });
});
