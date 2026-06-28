import filter from "lodash/filter.js";
import toLower from "lodash/toLower.js";
import React, { act } from "react";
// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

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

const useInputMock = vi.hoisted(() => {
  return vi.fn();
});

const mockIsLoading = vi.hoisted(() => {
  return { current: false };
});

async function importReactDomClient() {
  return import("react-dom/client") as Promise<
    typeof import("react-dom/client")
  >;
}

vi.mock("ink", () => {
  return {
    Box: boxComponent,
    Text: textComponent,
    useInput: useInputMock
  };
});

vi.mock("@ethang/store/use-store.js", () => {
  return {
    useStore: (
      _store: unknown,
      selector: (state: { isLoading: boolean }) => unknown
    ) => {
      return selector({ isLoading: mockIsLoading.current });
    }
  };
});

vi.mock("../stores/chat-store.js", () => {
  return {
    chatStore: {
      exitCallback: undefined,
      messagesReference: [],
      sendMessage: vi.fn().mockResolvedValue(undefined),
      state: { isLoading: false, messages: [] },
      update: vi.fn()
    }
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("InputField", () => {
  it("renders an input box with a prompt marker and registers input handler", async () => {
    const { createRoot } = await importReactDomClient();
    const { InputField } = await import("./input-field.tsx");

    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(InputField));
    });

    expect(toLower(container.getHTML())).toContain("<box");
    expect(useInputMock).toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it("input handler exercises all branches without throwing", async () => {
    const { createRoot } = await importReactDomClient();
    const { InputField } = await import("./input-field.tsx");

    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(InputField));
    });

    expect(useInputMock).toHaveBeenCalled();
    const handler = useInputMock.mock.calls[0]?.[0] as (
      char: string,
      key: Record<string, unknown>
    ) => void;

    // Exercise all the handler branches (coverage of lines 21-24, 28-29, 34-51)
    handler("", { return: true }); // empty input, return
    handler("a", {}); // regular char
    handler("", { backspace: true }); // backspace
    handler("", { delete: true }); // delete
    handler("\u{1B}[200~", {}); // paste start
    handler("", { return: true }); // return while pasting => newline
    handler("\u{1B}[201~", {}); // paste end

    await act(async () => {
      root.unmount();
    });
  });

  it("calls sendMessage on enter with non-empty input and clears input", async () => {
    const { createRoot } = await importReactDomClient();
    const { InputField } = await import("./input-field.tsx");
    const chatStoreModule = await import("../stores/chat-store.js");

    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(InputField));
    });

    // First render: handler captures input = ""
    // Add a character to the input so it becomes non-empty
    const firstHandler = useInputMock.mock.calls[0]?.[0] as (
      char: string,
      key: Record<string, unknown>
    ) => void;

    // Add a character - must be inside act() so React flushes the state update
    await act(async () => {
      firstHandler("H", {});
    });

    // After re-render, the new handler captures the updated input value
    const secondHandler = useInputMock.mock.calls[1]?.[0] as (
      char: string,
      key: { backspace?: boolean; return?: boolean }
    ) => void;

    // Press enter with non-empty input
    await act(async () => {
      secondHandler("", { return: true });
    });

    // chatStore.sendMessage should have been called with the trimmed input
    expect(chatStoreModule.chatStore.sendMessage).toHaveBeenCalledWith("H");

    await act(async () => {
      root.unmount();
    });
  });

  it("shortens input on backspace", async () => {
    const { createRoot } = await importReactDomClient();
    const { InputField } = await import("./input-field.tsx");
    const chatStoreModule = await import("../stores/chat-store.js");

    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(InputField));
    });

    // Add a character and then backspace - must be in act() to process state
    const firstHandler = useInputMock.mock.calls[0]?.[0] as (
      char: string,
      key: Record<string, unknown>
    ) => void;

    await act(async () => {
      firstHandler("H", {});
    });

    const secondHandler = useInputMock.mock.calls[1]?.[0] as (
      char: string,
      key: { backspace: boolean }
    ) => void;

    await act(async () => {
      secondHandler("", { backspace: true });
    });

    // After backspace, input should be empty; pressing enter should not send a message
    const thirdHandler = useInputMock.mock.calls[2]?.[0] as (
      char: string,
      key: { return: boolean }
    ) => void;

    await act(async () => {
      thirdHandler("", { return: true });
    });

    expect(chatStoreModule.chatStore.sendMessage).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it("filters out control characters with codePoint below 32", async () => {
    const { createRoot } = await importReactDomClient();
    const { InputField } = await import("./input-field.tsx");
    const chatStoreModule = await import("../stores/chat-store.js");

    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(InputField));
    });

    const handler = useInputMock.mock.calls[0]?.[0] as (
      char: string,
      key: Record<string, unknown>
    ) => void;

    // Tab character has codePoint 9 (< 32), should be filtered out
    // This exercises the false branch of `32 <= (char.codePointAt(0) ?? 0)`
    await act(async () => {
      handler("\t", {});
    });

    // Tab was rejected, input stays empty, so no re-render happened
    // (same handler). Pressing enter with empty input should not send.
    await act(async () => {
      handler("", { return: true });
    });

    expect(chatStoreModule.chatStore.sendMessage).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it("renders loading indicator when isLoading is true", async () => {
    const { createRoot } = await importReactDomClient();
    const { InputField } = await import("./input-field.tsx");

    const container = document.createElement("div");
    const root = createRoot(container);

    // Set isLoading to true
    mockIsLoading.current = true;

    await act(async () => {
      root.render(React.createElement(InputField));
    });

    const html = toLower(container.getHTML());
    expect(html).toContain("thinking");

    await act(async () => {
      root.unmount();
    });
  });
});
