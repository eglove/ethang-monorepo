import { describe, expect, it, vi } from "vitest";

vi.mock("../stores/chat-store.js", () => {
  return {
    chatStore: {
      state: { isLoading: false, messages: [] },
      update: vi.fn()
    }
  };
});

describe("MessageItem", () => {
  it("renders a regular user message with its content", async () => {
    const React = (await import("react")) as typeof import("react");
    const { renderToString } =
      // eslint-disable-next-line sonar/no-duplicate-string
      (await import("react-dom/server")) as typeof import("react-dom/server");
    const { messageItem } = await import("./message-item.tsx");

    const message = {
      content: "Hello there",
      id: "test-id-1",
      role: "user" as const,
      type: "message" as const
    };
    const output = renderToString(
      React.createElement(messageItem, {
        isSelected: false,
        message
      })
    );
    expect(output).toContain("Hello there");
    expect(output).toContain("user");
  });

  it("renders a system message", async () => {
    const React = (await import("react")) as typeof import("react");
    const { renderToString } =
      (await import("react-dom/server")) as typeof import("react-dom/server");
    const { messageItem } = await import("./message-item.tsx");

    const message = {
      content: "system notification",
      id: "test-id-2",
      type: "system" as const
    };
    const output = renderToString(
      React.createElement(messageItem, {
        isSelected: false,
        message
      })
    );
    expect(output).toContain("system notification");
  });

  it("renders a tool call message with name, input and output", async () => {
    const React = (await import("react")) as typeof import("react");
    const { renderToString } =
      (await import("react-dom/server")) as typeof import("react-dom/server");
    const { messageItem } = await import("./message-item.tsx");

    const message = {
      id: "test-id-3",
      input: { path: "src/index.ts" },
      name: "read_file",
      output: "file contents here",
      type: "tool_call" as const
    };
    const output = renderToString(
      React.createElement(messageItem, {
        isSelected: false,
        message
      })
    );
    expect(output).toContain("read_file");
    expect(output).toContain("file contents here");
  });

  it("renders selection indicator when isSelected is true", async () => {
    const React = (await import("react")) as typeof import("react");
    const { renderToString } =
      (await import("react-dom/server")) as typeof import("react-dom/server");
    const { messageItem } = await import("./message-item.tsx");

    const message = {
      content: "selectable",
      id: "test-id-4",
      role: "assistant" as const,
      type: "message" as const
    };
    const output = renderToString(
      React.createElement(messageItem, {
        isSelected: true,
        message
      })
    );
    expect(output).toContain("▶");
    expect(output).toContain("selectable");
  });

  it("renders a system message with isSelected true", async () => {
    const React = (await import("react")) as typeof import("react");
    const { renderToString } =
      (await import("react-dom/server")) as typeof import("react-dom/server");
    const { messageItem } = await import("./message-item.tsx");

    const message = {
      content: "system selected",
      id: "test-id-5",
      type: "system" as const
    };
    const output = renderToString(
      React.createElement(messageItem, {
        isSelected: true,
        message
      })
    );
    expect(output).toContain("▶");
    expect(output).toContain("system selected");
  });

  it("renders a tool call message with isSelected true", async () => {
    const React = (await import("react")) as typeof import("react");
    const { renderToString } =
      (await import("react-dom/server")) as typeof import("react-dom/server");
    const { messageItem } = await import("./message-item.tsx");

    const message = {
      id: "test-id-6",
      input: { path: "src/index.ts" },
      name: "read_file",
      output: "contents",
      type: "tool_call" as const
    };
    const output = renderToString(
      React.createElement(messageItem, {
        isSelected: true,
        message
      })
    );
    expect(output).toContain("▶");
    expect(output).toContain("read_file");
  });

  it("renders a tool call with empty input and empty output", async () => {
    const React = (await import("react")) as typeof import("react");
    const { renderToString } =
      (await import("react-dom/server")) as typeof import("react-dom/server");
    const { messageItem } = await import("./message-item.tsx");

    const message = {
      id: "test-id-7",
      input: {},
      name: "no_op",
      output: "",
      type: "tool_call" as const
    };
    const output = renderToString(
      React.createElement(messageItem, {
        isSelected: false,
        message
      })
    );
    expect(output).toContain("no_op");
    expect(output).not.toContain("Input:");
    expect(output).not.toContain("Output:");
  });
});
