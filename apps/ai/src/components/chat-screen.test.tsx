import constant from "lodash/constant.js";
import filter from "lodash/filter.js";
import React, { act } from "react";
// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";

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

vi.mock("ink", () => {
  return {
    Box: boxComponent,
    useApp: () => {
      return { exit: vi.fn() };
    }
  };
});

vi.mock("../stores/chat-store.js", () => {
  return {
    chatStore: {
      exitCallback: undefined,
      messagesReference: [],
      sendMessage: vi.fn(),
      state: { isLoading: false, messages: [] },
      update: vi.fn()
    }
  };
});

vi.mock("./input-field.js", () => {
  const inputFieldComponent = constant(null);
  return {
    InputField: inputFieldComponent
  };
});

vi.mock("./message-list.js", () => {
  const messageListComponent = constant(null);
  return {
    MessageList: messageListComponent
  };
});

describe("ChatScreen", () => {
  it("assigns and cleans up the exit callback via useEffect", async () => {
    const { createRoot } =
      (await import("react-dom/client")) as typeof import("react-dom/client");
    const { ChatScreen } = await import("./chat-screen.tsx");
    const chatStoreModule = await import("../stores/chat-store.js");
    const chatStore = chatStoreModule.chatStore as unknown as {
      exitCallback: unknown;
    };

    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(ChatScreen));
    });

    // useEffect should have run and assigned exitCallback
    expect(chatStore.exitCallback).toBeInstanceOf(Function);

    await act(async () => {
      root.unmount();
    });

    // Cleanup function should have reset exitCallback
    expect(chatStore.exitCallback).toBeUndefined();
  });
});
