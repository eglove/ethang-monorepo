import { useStore } from "@ethang/store/use-store.js";
import { Box, Text, useInput } from "ink";
import trim from "lodash/trim.js";
import { useState } from "react";

import { chatStore } from "../stores/chat-store.ts";

export function InputField() {
  const [input, setInput] = useState("");
  const isLoading = useStore(chatStore, (state) => {
    return state.isLoading;
  });

  useInput(
    (char: string, key: { backspace: boolean; return: boolean }) => {
      if (key.return) {
        const trimmed = trim(input);
        if (trimmed && !isLoading) {
          chatStore.sendMessage(trimmed).catch(globalThis.console.error);
          setInput("");
        }
        return;
      }

      if (key.backspace) {
        setInput((previous) => {
          return previous.slice(0, -1);
        });
        return;
      }

      if (1 === char.length && 32 <= (char.codePointAt(0) ?? 0)) {
        setInput((previous) => {
          return previous + char;
        });
      }
    },
    { isActive: !isLoading }
  );

  return (
    <Box>
      <Text color="green">{"> "}</Text>
      <Text>{input}</Text>
      {isLoading && <Text color="gray"> (thinking...)</Text>}
    </Box>
  );
}
