import { describe, expect, it } from "vitest";

import type { ClaudeAdapter, ClaudeResult } from "./claude-adapter.ts";

class TestClaudeAdapter implements ClaudeAdapter {
  private callIndex = 0;
  private readonly responses: ClaudeResult[] = [];

  public constructor(responses: ClaudeResult[] = []) {
    this.responses = responses;
  }

  public async executePrompt(_prompt: string): Promise<ClaudeResult> {
    const response = await Promise.resolve(
      this.responses[this.callIndex] ?? {
        data: { result: "default response" },
        ok: true as const,
      },
    );
    this.callIndex += 1;
    return response;
  }

  public async routePairMessage(_message: string): Promise<ClaudeResult> {
    const response = await Promise.resolve(
      this.responses[this.callIndex] ?? {
        data: { result: "pair response" },
        ok: true as const,
      },
    );
    this.callIndex += 1;
    return response;
  }

  public async streamPrompt(_prompt: string): Promise<ClaudeResult> {
    const response = await Promise.resolve(
      this.responses[this.callIndex] ?? {
        data: { result: "stream response" },
        ok: true as const,
      },
    );
    this.callIndex += 1;
    return response;
  }
}

describe("ClaudeAdapter Port", () => {
  it("executePrompt returns a success result", async () => {
    const adapter = new TestClaudeAdapter([
      { data: { summary: "test" }, ok: true },
    ]);
    const result = await adapter.executePrompt("test prompt");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveProperty("summary");
    }
  });

  it("executePrompt returns a claude_api_timeout error", async () => {
    const adapter = new TestClaudeAdapter([
      { errorKind: "claude_api_timeout", message: "Timeout", ok: false },
    ]);
    const result = await adapter.executePrompt("test");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorKind).toBe("claude_api_timeout");
    }
  });

  it("executePrompt returns a claude_api_rate_limit error", async () => {
    const adapter = new TestClaudeAdapter([
      {
        errorKind: "claude_api_rate_limit",
        message: "Rate limited",
        ok: false,
      },
    ]);
    const result = await adapter.executePrompt("test");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorKind).toBe("claude_api_rate_limit");
    }
  });

  it("streamPrompt supports multi-turn streaming", async () => {
    const adapter = new TestClaudeAdapter([
      { data: { turn: 1 }, ok: true },
      { data: { turn: 2 }, ok: true },
    ]);
    const result1 = await adapter.streamPrompt("turn 1");
    const result2 = await adapter.streamPrompt("turn 2");
    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);
  });

  it("routePairMessage returns a response", async () => {
    const adapter = new TestClaudeAdapter([
      { data: { paired: true }, ok: true },
    ]);
    const result = await adapter.routePairMessage("pair message");
    expect(result.ok).toBe(true);
  });
});

export { TestClaudeAdapter };
