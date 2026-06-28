export type ChatMessage = Message | SystemMessage | ToolCall;
export type Message = {
  readonly content: string;
  readonly role: "assistant" | "user";
  readonly type: "message";
};
export type SystemMessage = {
  readonly content: string;
  readonly type: "system";
};

export type ToolCall = {
  input: Record<string, unknown>;
  name: string;
  output: string;
  readonly type: "tool_call";
};

export const message = (
  content: string,
  role: "assistant" | "user"
): Message => {
  return { content, role, type: "message" as const };
};

export const system = (content: string): SystemMessage => {
  return { content, type: "system" as const };
};

export const toolCall = (
  input: Record<string, unknown>,
  name: string,
  output: string
): ToolCall => {
  return {
    input,
    name,
    output,
    type: "tool_call" as const
  };
};

export const isMessage = (_message: ChatMessage): _message is Message => {
  return "message" === _message.type;
};

export const isSystem = (_message: ChatMessage): _message is SystemMessage => {
  return "system" === _message.type;
};

export const isToolCall = (_message: ChatMessage): _message is ToolCall => {
  return "tool_call" === _message.type;
};

export type ChatState = {
  isLoading: boolean;
  messages: ChatMessage[];
};
