import { createOpenaiChatCompletions } from "@tanstack/ai-openai";

import {
  OPENROUTER_API_KEY,
  OPENROUTER_BASE_URL,
  OPENROUTER_MODEL
} from "../environment.ts";

export function createOpenRouterAdapter() {
  // @ts-expect-error allow any model
  return createOpenaiChatCompletions(OPENROUTER_MODEL, OPENROUTER_API_KEY, {
    baseURL: OPENROUTER_BASE_URL
  });
}
