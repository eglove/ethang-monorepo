import { modelMessageToUIMessage, type UIMessage } from "@tanstack/ai";

export function makeUIMessage(
  role: "assistant" | "user",
  content: string
): UIMessage {
  return modelMessageToUIMessage({ content, role });
}
