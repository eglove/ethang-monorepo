import { Box, useApp } from "ink";
import { useEffect } from "react";

import { chatStore } from "../stores/chat-store.js";
import { InputField } from "./input-field.js";
import { MessageList } from "./message-list.js";

export function ChatScreen() {
  const { exit } = useApp();

  useEffect(() => {
    chatStore.exitCallback = exit;
    return () => {
      chatStore.exitCallback = undefined;
    };
  }, [exit]);

  return (
    <Box height="100%" flexDirection="column">
      <MessageList />
      <InputField />
    </Box>
  );
}
