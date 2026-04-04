import constant from "lodash/constant.js";
import noop from "lodash/noop.js";
import { describe, expect, it } from "vitest";

import {
  type ClaudeAdapter,
  type ClaudeResult,
  isClaudeError,
  isClaudeSuccess,
} from "./claude-adapter.ts";
import { type GitAdapter, isGitSuccess } from "./git-adapter.ts";

describe("ClaudeAdapter port", () => {
  it("ClaudeAdapter type is usable", () => {
    const mock: ClaudeAdapter = {
      executePrompt: async () => {
        await Promise.resolve();
        return { data: {}, ok: true as const };
      },
      routePairMessage: async () => {
        await Promise.resolve();
        return { data: {}, ok: true as const };
      },
      streamPrompt: async () => {
        await Promise.resolve();
        return { data: {}, ok: true as const };
      },
    };
    expect(mock).toBeDefined();
  });

  it("isClaudeSuccess returns true for success result", () => {
    const success: ClaudeResult = { data: { test: true }, ok: true };
    expect(isClaudeSuccess(success)).toBe(true);
    expect(isClaudeError(success)).toBe(false);
  });

  it("isClaudeError returns true for error result", () => {
    const error: ClaudeResult = {
      errorKind: "claude_api_timeout",
      message: "test",
      ok: false,
    };
    expect(isClaudeError(error)).toBe(true);
    expect(isClaudeSuccess(error)).toBe(false);
  });
});

describe("GitAdapter port", () => {
  it("GitAdapter type is usable", () => {
    const mock: GitAdapter = {
      acquireLock: constant(true),
      checkout: async () => {
        await Promise.resolve();
        return { ok: true };
      },
      commit: async () => {
        await Promise.resolve();
        return { ok: true };
      },
      createBranch: async () => {
        await Promise.resolve();
        return { ok: true };
      },
      getCurrentBranch: async () => {
        await Promise.resolve();
        return "main";
      },
      push: async () => {
        await Promise.resolve();
        return { ok: true };
      },
      releaseLock: noop,
    };
    expect(mock).toBeDefined();
  });

  it("isGitSuccess returns true for ok result", () => {
    expect(isGitSuccess({ ok: true })).toBe(true);
  });

  it("isGitSuccess returns false for failed result", () => {
    expect(isGitSuccess({ ok: false })).toBe(false);
  });
});
