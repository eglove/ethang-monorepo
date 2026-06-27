import { Schema } from "effect";
import get from "lodash/get.js";

import type { ChatMessage } from "../stores/chat-types.ts";

type ToolCallMessage = {
  input: Record<string, unknown>;
  name: string;
  output: string;
  type: "tool_call";
};

export function updateToolCallInput(
  messages: ChatMessage[],
  _toolCallId: string,
  accumulated: string
): void {
  for (let index = messages.length - 1; 0 <= index; index -= 1) {
    const message = get(messages, index);
    if (isToolCallMessage(message)) {
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

function isToolCallMessage(message: ChatMessage): message is ToolCallMessage {
  return "tool_call" === message.type;
}
