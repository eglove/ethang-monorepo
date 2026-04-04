import Anthropic from "@anthropic-ai/sdk";
import filter from "lodash/filter.js";
import includes from "lodash/includes.js";
import isError from "lodash/isError.js";
import map from "lodash/map.js";

import type { ClaudeAdapter, ClaudeResult } from "../ports/claude-adapter.ts";

export type ClaudeSdkConfig = {
  maxTokens?: number;
  model?: string;
};

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 64_000;

export class ClaudeSdkAdapter implements ClaudeAdapter {
  private readonly client: Anthropic;
  private readonly maxTokens: number;
  private readonly model: string;

  public constructor(config: ClaudeSdkConfig = {}) {
    this.client = new Anthropic();
    this.model = config.model ?? DEFAULT_MODEL;
    this.maxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS;
  }

  public async executePrompt(prompt: string): Promise<ClaudeResult> {
    try {
      const message = await this.client.messages.create({
        max_tokens: this.maxTokens,
        messages: [{ content: prompt, role: "user" }],
        model: this.model,
      });

      return { data: this.extractText(message), ok: true };
    } catch (error: unknown) {
      return this.mapError(error);
    }
  }

  public mapError(error: unknown): ClaudeResult {
    const message = isError(error) ? error.message : String(error);

    if (includes(message, "rate")) {
      return { errorKind: "claude_api_rate_limit", message, ok: false };
    }

    if (includes(message, "timeout") || includes(message, "ETIMEDOUT")) {
      return { errorKind: "claude_api_timeout", message, ok: false };
    }

    return { errorKind: "claude_api_timeout", message, ok: false };
  }

  public async routePairMessage(message: string): Promise<ClaudeResult> {
    return this.executePrompt(message);
  }

  public async streamPrompt(prompt: string): Promise<ClaudeResult> {
    try {
      const stream = this.client.messages.stream({
        max_tokens: this.maxTokens,
        messages: [{ content: prompt, role: "user" }],
        model: this.model,
      });

      const message = await stream.finalMessage();
      return { data: this.extractText(message), ok: true };
    } catch (error: unknown) {
      return this.mapError(error);
    }
  }

  private extractText(message: Anthropic.Message): string {
    const textBlocks = filter(
      message.content,
      (block): block is Anthropic.TextBlock => {
        return "text" === block.type;
      },
    );

    return map(textBlocks, (block) => block.text).join("\n");
  }
}
