import filter from "lodash/filter.js";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const storeMessages = [
  {
    content: "Welcome",
    role: "assistant",
    type: "message"
  },
  {
    content: "Hello",
    role: "user",
    type: "message"
  },
  {
    content: "Note",
    type: "system"
  },
  {
    input: { path: "file.ts" },
    name: "tool_a",
    output: "result",
    type: "tool_call"
  }
];

function boxComponent({
  children,
  ...rest
}: {
  [key: string]: unknown;
  children?: React.ReactNode;
}) {
  const entries = Object.entries(rest);
  const filteredEntries = filter(entries, ([key]) => {
    return "children" !== key;
  });
  return React.createElement(
    "Box",
    Object.fromEntries(filteredEntries),
    children
  );
}

function textComponent({
  children,
  ...rest
}: {
  [key: string]: unknown;
  children?: React.ReactNode;
}) {
  const entries = Object.entries(rest);
  const filteredEntries = filter(entries, ([key]) => {
    return "children" !== key;
  });
  return React.createElement(
    "Text",
    Object.fromEntries(filteredEntries),
    children
  );
}

vi.mock("ink", () => {
  return {
    Box: boxComponent,
    Text: textComponent
  };
});

vi.mock("@ethang/store/use-store.js", () => {
  return {
    useStore: (_store: unknown, selector: (state: unknown) => unknown) => {
      // Actually invoke the selector so its body is covered
      try {
        return selector({ messages: storeMessages });
      } catch {
        return null;
      }
    }
  };
});

vi.mock("../stores/chat-store.js", () => {
  return {
    chatStore: {
      state: { isLoading: false, messages: storeMessages },
      update: vi.fn()
    }
  };
});

describe("MessageList", () => {
  it("renders a list of mixed message types", async () => {
    const { renderToString } =
      (await import("react-dom/server")) as typeof import("react-dom/server");
    const { MessageList } = await import("./message-list.tsx");

    const output = renderToString(React.createElement(MessageList));
    expect(output).toContain("Welcome");
    expect(output).toContain("Hello");
    expect(output).toContain("Note");
    expect(output).toContain("tool_a");
    expect(output).toContain("result");
  });
});
