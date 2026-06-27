import type { MCPToolSource } from "@tanstack/ai";

import isString from "lodash/isString.js";
import map from "lodash/map.js";
import convertToString from "lodash/toString.js";

import { chatStore } from "../stores/chat-store.js";
import { logChatMessage } from "./chat-logger.js";
import { makeUIMessage } from "./make-ui-message.js";
import { updateToolCallInput } from "./update-tool-call-input.js";
import { updateToolCallOutput } from "./update-tool-call-output.js";

export async function closeClients(clients: MCPToolSource[]): Promise<void> {
  await Promise.all(
    map(clients, async (client) => {
      return client.close();
    })
  );
}

export async function processStream(
  stream: AsyncIterable<{ [key: string]: unknown; type: string }>
): Promise<string> {
  let content = "";
  const toolArgumentsAccum = new Map<string, string>();
  let currentAssistantIndex = -1;

  const updateContent = (updated: string): void => {
    content = updated;
  };

  const setIndex = (index: number) => {
    currentAssistantIndex = index;
  };

  for await (const chunk of stream) {
    await handleChunk(
      chunk,
      content,
      toolArgumentsAccum,
      updateContent,
      currentAssistantIndex,
      setIndex
    );
  }

  if (content) {
    chatStore.messagesReference.push(makeUIMessage("assistant", content));
    await logChatMessage(`assistant: ${content}`);
  }

  return content;
}

async function handleChunk(
  chunk: { [key: string]: unknown; type: string },
  content: string,
  toolArgumentsAccum: Map<string, string>,
  setContent: (value: string) => void,
  currentAssistantIndex: number,
  setCurrentAssistantIndex: (index: number) => void
): Promise<void> {
  switch (chunk.type) {
    case "TEXT_MESSAGE_CONTENT": {
      setContent(
        handleTextContent(
          chunk["delta"],
          content,
          currentAssistantIndex,
          setCurrentAssistantIndex
        )
      );
      break;
    }
    case "TOOL_CALL_ARGS": {
      await handleToolCallArguments(chunk, toolArgumentsAccum);
      break;
    }
    case "TOOL_CALL_RESULT": {
      await handleToolCallResult(chunk);
      break;
    }
    case "TOOL_CALL_START": {
      await handleToolCallStart(chunk, toolArgumentsAccum);
      break;
    }
    // No default
  }
}

function handleTextContent(
  delta: unknown,
  content: string,
  currentAssistantIndex: number,
  setCurrentAssistantIndex: (index: number) => void
): string {
  if (!isString(delta) || !delta) {
    return content;
  }
  const newContent = content + delta;
  chatStore.update((draft) => {
    // If we have a tracked assistant message and it's still the last message
    // (no tool calls have been pushed after it), update it in place.
    if (
      0 <= currentAssistantIndex &&
      currentAssistantIndex < draft.messages.length
    ) {
      const existing = draft.messages[currentAssistantIndex];
      const isLastMessage = currentAssistantIndex === draft.messages.length - 1;
      if (
        "message" === existing?.type &&
        "assistant" === existing.role &&
        isLastMessage
      ) {
        draft.messages[currentAssistantIndex] = {
          content: newContent,
          role: "assistant",
          type: "message"
        };
        return;
      }
    }
    // Otherwise, push a new assistant message at the bottom (after any tool calls).
    draft.messages.push({
      content: newContent,
      role: "assistant",
      type: "message"
    });
    setCurrentAssistantIndex(draft.messages.length - 1);
  });
  return newContent;
}

async function handleToolCallArguments(
  chunk: Record<string, unknown>,
  toolArgumentsAccum: Map<string, string>
): Promise<void> {
  const argumentsString = chunk["args"];
  const toolCallId = isString(chunk["toolCallId"]) ? chunk["toolCallId"] : "";
  if (!isString(argumentsString) || !argumentsString) {
    return;
  }
  toolArgumentsAccum.set(
    toolCallId,
    (toolArgumentsAccum.get(toolCallId) ?? "") + argumentsString
  );
  const accumulated = toolArgumentsAccum.get(toolCallId) ?? "";
  await logChatMessage(`tool_call_args (${toolCallId}): ${accumulated}`);
  chatStore.update((draft) => {
    updateToolCallInput(draft.messages, toolCallId, accumulated);
  });
}

async function handleToolCallResult(
  chunk: Record<string, unknown>
): Promise<void> {
  const resultContent = chunk["content"];
  const toolName = isString(chunk["toolName"]) ? chunk["toolName"] : "";
  await logChatMessage(
    `tool_call_result (${toolName}): ${convertToString(resultContent)}`
  );
  chatStore.update((draft) => {
    updateToolCallOutput(draft.messages, toolName, resultContent);
  });
}

async function handleToolCallStart(
  chunk: Record<string, unknown>,
  toolArgumentsAccum: Map<string, string>
): Promise<void> {
  const toolName = isString(chunk["toolName"]) ? chunk["toolName"] : "unknown";
  const toolCallId = isString(chunk["toolCallId"]) ? chunk["toolCallId"] : "";
  toolArgumentsAccum.set(toolCallId, "");
  await logChatMessage(`tool_call_start: ${toolName}`);
  chatStore.update((draft) => {
    draft.messages.push({
      input: {},
      name: toolName,
      output: "",
      type: "tool_call"
    });
  });
}
