import { describe, expect, it } from "vitest";

import { ChatMessage } from "../stores/chat-types.ts";
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
      { content: "Hello", id: "msg-1", role: "user", type: "message" },
      {
        id: "tool-1",
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
      { content: "Hello", id: "msg-2", role: "user", type: "message" }
    ];

    updateToolCallInput(messages, "some-id", '{"key": "value"}');

    expect(messages[0]).toEqual({
      content: "Hello",
      id: "msg-2",
      role: "user",
      type: "message"
    });
  });

  it("does nothing when accumulated is not a valid object", () => {
    const messages: ChatMessage[] = [
      { content: "Hello", id: "msg-3", role: "user", type: "message" },
      {
        id: "tool-3",
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
      { content: "Hello", id: "msg-4", role: "user", type: "message" },
      {
        id: "tool-4",
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
        id: "tool-5",
        input: { first: true },
        name: "first_tool",
        output: "",
        type: "tool_call"
      },
      { content: "Middle", id: "msg-5", role: "assistant", type: "message" },
      {
        id: "tool-6",
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
