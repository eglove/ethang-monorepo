import { describe, expect, it } from "vitest";

import {
  type ChatMessage,
  isToolCall,
  message,
  type ToolCall,
  toolCall
} from "../stores/chat-types.js";
import { updateToolCallOutput } from "./update-tool-call-output.js";

const EXPECTED_TOOL_CALL_MESSAGE = "Expected tool call";

function asToolCall(_message: ChatMessage | undefined): null | ToolCall {
  return _message && isToolCall(_message) ? _message : null;
}

describe("updateToolCallOutput", () => {
  it("updates the output of a matching tool call by name", () => {
    const messages: ChatMessage[] = [
      message("Hello", "user"),
      toolCall({}, "first_tool", "")
    ];

    updateToolCallOutput(messages, "first_tool", "result text");

    const _message = asToolCall(messages[1]);
    if (!_message) throw new Error(EXPECTED_TOOL_CALL_MESSAGE);
    expect(_message.output).toBe("result text");
  });

  it("does not update when tool name does not match", () => {
    const messages: ChatMessage[] = [toolCall({}, "my_tool", "")];

    updateToolCallOutput(messages, "other_tool", "result");

    const _message = asToolCall(messages[0]);
    if (!_message) throw new Error(EXPECTED_TOOL_CALL_MESSAGE);
    expect(_message.output).toBe("");
  });

  it("updates the last matching tool call when names are duplicated", () => {
    const messages: ChatMessage[] = [
      toolCall({ first: true }, "dup_tool", ""),
      message("Between", "assistant"),
      toolCall({ second: true }, "dup_tool", "")
    ];

    updateToolCallOutput(messages, "dup_tool", "latest result");

    const message2 = asToolCall(messages[2]);
    const message0 = asToolCall(messages[0]);
    if (!message2 || !message0) throw new Error("Expected tool calls");
    expect(message2.output).toBe("latest result");
    expect(message0.output).toBe("");
  });

  it("stringifies non-string result content", () => {
    const messages: ChatMessage[] = [toolCall({}, "json_tool", "")];

    updateToolCallOutput(messages, "json_tool", { key: "value" });

    const _message = asToolCall(messages[0]);
    if (!_message) throw new Error(EXPECTED_TOOL_CALL_MESSAGE);
    expect(_message.output).toBe(JSON.stringify({ key: "value" }, null, 2));
  });

  it("handles empty string result", () => {
    const messages: ChatMessage[] = [toolCall({}, "my_tool", "previous")];

    updateToolCallOutput(messages, "my_tool", "");

    const _message = asToolCall(messages[0]);
    if (!_message) throw new Error(EXPECTED_TOOL_CALL_MESSAGE);
    expect(_message.output).toBe("");
  });

  it("does nothing when messages array is empty", () => {
    const messages: ChatMessage[] = [];
    updateToolCallOutput(messages, "any_tool", "result");
    expect(messages).toHaveLength(0);
  });

  it("preserves input and name fields when updating output", () => {
    const messages: ChatMessage[] = [
      toolCall({ key: "value" }, "stable_tool", "")
    ];

    updateToolCallOutput(messages, "stable_tool", "new output");

    const _message = asToolCall(messages[0]);
    if (!_message) throw new Error(EXPECTED_TOOL_CALL_MESSAGE);
    expect(_message.input).toEqual({ key: "value" });
    expect(_message.name).toBe("stable_tool");
  });
});
