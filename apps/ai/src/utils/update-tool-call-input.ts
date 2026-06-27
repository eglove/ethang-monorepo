import { Schema } from "effect";

import type { ChatMessage } from "../stores/chat-store.js";

export function updateToolCallInput(
  messages: ChatMessage[],
  _toolCallId: string,
  accumulated: string
): void {
  for (let index = messages.length - 1; 0 <= index; index -= 1) {
    const message = messages[index];
    if ("tool_call" === message?.type) {
      const decoded = Schema.decodeUnknownEither(
        Schema.parseJson(
          Schema.Record({ key: Schema.String, value: Schema.Unknown })
        )
      )(accumulated);

      if ("Right" === decoded._tag) {
        message.input = decoded.right;
      }

      return;
    }
  }
}
