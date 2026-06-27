import { useStore } from "@ethang/store/use-store.js";
import { Box, Text } from "ink";
import isObject from "lodash/isObject.js";
import map from "lodash/map.js";

import { chatStore } from "../stores/chat-store.js";

export function MessageList() {
  const messages = useStore(chatStore, (state) => {
    return state.messages;
  });

  return (
    <Box flexDirection="column">
      {map(messages, (message, index) => {
        if ("system" === message.type) {
          return (
            <Box key={index} marginBottom={1}>
              <Text color="yellow">{message.content}</Text>
            </Box>
          );
        }

        if ("tool_call" === message.type) {
          const { input } = message;
          const { output } = message;
          return (
            <Box key={index} marginBottom={1} flexDirection="column">
              <Text color="cyan">Tool: {message.name}</Text>
              {isObject(input) && (
                <Text color="gray">Input: {JSON.stringify(input)}</Text>
              )}
              {"" !== output && (
                <Text color="gray">Output: {output.slice(0, 200)}</Text>
              )}
            </Box>
          );
        }

        const color = "user" === message.role ? "green" : "white";
        const prefix = "user" === message.role ? "> " : "";

        return (
          <Box key={index} marginBottom={1}>
            <Text color={color}>
              {prefix}
              {message.content}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
