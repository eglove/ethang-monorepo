import type { Result } from "./result.ts";

export type FileOperations = {
  exists: (path: string) => Promise<Result<boolean>>;
  mkdir: (path: string) => Promise<Result<void>>;
  readFile: (path: string) => Promise<Result<string>>;
  writeFile: (path: string, content: string) => Promise<Result<void>>;
};

export type GitOperations = {
  add: (files: readonly string[]) => Promise<Result<string>>;
  commit: (message: string) => Promise<Result<string>>;
  createBranch: (name: string) => Promise<Result<string>>;
  diff: () => Promise<Result<string>>;
  status: () => Promise<Result<string>>;
};

export type LlmChatParameters = {
  messages: { content: string; role: "assistant" | "system" | "user" }[];
  model: string;
  temperature?: number;
};

export type LlmProvider = {
  chat: (
    parameters: LlmChatParameters,
  ) => Promise<Result<AsyncIterable<LlmStreamChunk>>>;
  getModel: (stageName: string) => string;
};

export type LlmStreamChunk = {
  content: string;
  done: boolean;
};
