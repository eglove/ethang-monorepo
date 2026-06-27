import get from "lodash/get.js";
import isString from "lodash/isString.js";

import type { ChatMessage } from "../stores/chat-types.ts";

type ToolCallMessage = {
  input: Record<string, unknown>;
  name: string;
  output: string;
  type: "tool_call";
};

export function updateToolCallOutput(
  messages: ChatMessage[],
  toolName: string,
  resultContent: unknown
): void {
  for (let index = messages.length - 1; 0 <= index; index -= 1) {
    const message: ChatMessage = get(messages, index);
    if (isToolCallMessage(message) && message.name === toolName) {
      const output = isString(resultContent)
        ? resultContent
        : JSON.stringify(resultContent, null, 2);
      messages[index] = { ...message, output } satisfies ChatMessage;
      return;
    }
  }
}

function isToolCallMessage(message: ChatMessage): message is ToolCallMessage {
  return "tool_call" === message.type;
}
