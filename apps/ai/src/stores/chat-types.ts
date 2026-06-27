export type ChatMessage =
  | {
      content: string;
      role: "assistant" | "user";
      type: "message";
    }
  | {
      content: string;
      type: "system";
    }
  | {
      input: Record<string, unknown>;
      name: string;
      output: string;
      type: "tool_call";
    };

export type ChatState = {
  isLoading: boolean;
  messages: ChatMessage[];
};
