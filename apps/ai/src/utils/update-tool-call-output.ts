import isString from "lodash/isString.js";

import type { ChatMessage } from "../stores/chat-store.js";

export function updateToolCallOutput(
  messages: ChatMessage[],
  toolName: string,
  resultContent: unknown
): void {
  for (let index = messages.length - 1; 0 <= index; index -= 1) {
    const message = messages[index];
    if ("tool_call" === message?.type && message.name === toolName) {
      const output = isString(resultContent)
        ? resultContent
        : JSON.stringify(resultContent, null, 2);
      messages[index] = { ...message, output };
      return;
    }
  }
}
