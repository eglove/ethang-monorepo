import { describe, expect, it } from "vitest";

import { makeUIMessage } from "./make-ui-message.js";

describe("makeUIMessage", () => {
  it("creates a UIMessage for user role", () => {
    const message = makeUIMessage("user", "Hello, world!");

    expect(message.role).toBe("user");
    expect(message.id).toBeDefined();
    expect(typeof message.id).toBe("string");
    expect(message.parts).toHaveLength(1);
    expect(message.parts[0]).toEqual({
      content: "Hello, world!",
      type: "text"
    });
  });

  it("creates a UIMessage for assistant role", () => {
    const message = makeUIMessage("assistant", "I can help with that.");

    expect(message.role).toBe("assistant");
    expect(message.id).toBeDefined();
    expect(message.parts).toHaveLength(1);
    expect(message.parts[0]).toEqual({
      content: "I can help with that.",
      type: "text"
    });
  });

  it("creates unique IDs for each message", () => {
    const message1 = makeUIMessage("user", "first");
    const message2 = makeUIMessage("user", "second");

    expect(message1.id).not.toBe(message2.id);
  });

  it("works with empty content", () => {
    const message = makeUIMessage("user", "");

    expect(message.role).toBe("user");
    expect(message.id).toBeDefined();
    expect(message.parts).toHaveLength(0);
  });
});
