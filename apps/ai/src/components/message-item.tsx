import { Box, Text } from "ink";
import keys from "lodash/keys.js";

import {
  type ChatMessage,
  isSystem,
  isToolCall,
  type Message,
  type SystemMessage,
  type ToolCall
} from "../stores/chat-types.js";
import { renderMarkdown } from "../utils/markdown.js";

const SELECTED_BG = "#0b2942"; // deep blue highlight
const GUTTER_COLOR = "#5f7e97"; // muted gray

type MessageItemProperties = Readonly<{
  isSelected: boolean;
  message: ChatMessage;
}>;

export function MessageItem({ isSelected, message }: MessageItemProperties) {
  if (isSystem(message)) {
    return renderSystemMessage(message, isSelected);
  }

  if (isToolCall(message)) {
    return renderToolCall(message, isSelected);
  }

  return renderRegularMessage(message, isSelected);
}

function renderRegularMessage(message: Message, isSelected: boolean) {
  const gutter = isSelected ? "▶ " : "  ";
  const contentBg = isSelected ? SELECTED_BG : undefined;
  const roleColor = "user" === message.role ? "green" : "white";
  const renderContent =
    "assistant" === message.role
      ? renderMarkdown(message.content)
      : message.content;
  return (
    <Box paddingX={0} marginBottom={1} backgroundColor={contentBg}>
      <Text color={GUTTER_COLOR}>{gutter}</Text>
      <Text bold color={roleColor}>
        {message.role}
      </Text>
      <Text>{"\n"}</Text>
      <Box paddingLeft={4} flexDirection="column">
        <Text color={roleColor}>{renderContent}</Text>
      </Box>
    </Box>
  );
}

function renderSystemMessage(message: SystemMessage, isSelected: boolean) {
  const gutter = isSelected ? "▶ " : "  ";
  return (
    <Box marginBottom={1}>
      <Text color={GUTTER_COLOR}>{gutter}</Text>
      <Text color="yellow">{message.content}</Text>
    </Box>
  );
}

function renderToolCall(message: ToolCall, isSelected: boolean) {
  const gutter = isSelected ? "▶ " : "  ";
  const { input } = message;
  const hasInput = input !== undefined && 0 < keys(input).length;
  const { output } = message;
  const hasOutput = "string" === typeof output && "" !== output;
  const outputText = "string" === typeof output ? output.slice(0, 200) : "";
  return (
    <Box marginBottom={1} flexDirection="column">
      <Box>
        <Text color={GUTTER_COLOR}>{gutter}</Text>
        <Text color="cyan">Tool: {message.name}</Text>
      </Box>
      {hasInput && (
        <Text color={GUTTER_COLOR}>
          {" "}
          {}
          Input: {JSON.stringify(input)}
        </Text>
      )}
      {hasOutput && <Text color={GUTTER_COLOR}> Output: {outputText}</Text>}
    </Box>
  );
}
