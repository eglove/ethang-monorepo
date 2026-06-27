import { Box } from "ink";

import { ChatScreen } from "./components/chat-screen.js";

export function App() {
  return (
    <Box height="100%" flexDirection="column">
      <ChatScreen />
    </Box>
  );
}
