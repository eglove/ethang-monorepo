import { describe, expect, it } from "vitest";

import {
  isMessage,
  isSystem,
  isToolCall,
  message,
  system,
  toolCall
} from "./chat-types.js";

describe("chat-types type guards", () => {
  it("isMessage returns true only for message type", () => {
    expect(isMessage(message("Hi", "user"))).toBe(true);
    expect(isMessage(message("Hi", "assistant"))).toBe(true);
    expect(isMessage(system("sys"))).toBe(false);
    expect(isMessage(toolCall({}, "t", ""))).toBe(false);
  });

  it("isSystem returns true only for system type", () => {
    expect(isSystem(system("notice"))).toBe(true);
    expect(isSystem(message("Hi", "user"))).toBe(false);
    expect(isSystem(toolCall({}, "t", ""))).toBe(false);
  });

  it("isToolCall returns true only for tool_call type", () => {
    expect(isToolCall(toolCall({}, "t", ""))).toBe(true);
    expect(isToolCall(message("Hi", "user"))).toBe(false);
    expect(isToolCall(system("notice"))).toBe(false);
  });

  it("preserves branding so structural equality differs across types", () => {
    const _message = message("Hi", "user");
    const sys = system("Hi");
    const tc = toolCall({}, "Hi", "");

    // All three share fields but different type tags
    expect(_message.type).toBe("message");
    expect(sys.type).toBe("system");
    expect(tc.type).toBe("tool_call");

    // isMessage is false for system & tool_call even if content overlaps
    expect(isMessage(sys)).toBe(false);
    expect(isSystem(tc)).toBe(false);
    expect(isToolCall(_message)).toBe(false);
  });
});
