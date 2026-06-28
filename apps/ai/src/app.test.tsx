import constant from "lodash/constant.js";
import filter from "lodash/filter.js";
import React from "react";
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
    Box: boxComponent
  };
});

vi.mock("./components/chat-screen.js", () => {
  const chatScreenComponent = constant(null);
  return {
    ChatScreen: chatScreenComponent
  };
});

describe("App", () => {
  it("renders a Box wrapper around ChatScreen", async () => {
    const { renderToString } =
      (await import("react-dom/server")) as typeof import("react-dom/server");
    const { App } = await import("./app.tsx");

    const output = renderToString(React.createElement(App));
    expect(output).toContain('height="100%"');
    expect(output).toContain("<Box");
  });
});
