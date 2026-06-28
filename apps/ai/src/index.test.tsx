import constant from "lodash/constant.js";
import { describe, expect, it, vi } from "vitest";

vi.mock("dotenv/config", () => {
  return {};
});

vi.mock("ink", () => {
  return {
    render: vi.fn()
  };
});

vi.mock("./app.tsx", () => {
  const appComponent = constant(null);
  return {
    App: appComponent
  };
});

vi.mock("./utils/chat-logger.js", () => {
  return {
    initializeLogFile: vi.fn().mockResolvedValue(undefined)
  };
});

describe("index entrypoint", () => {
  it("initializes the log file and renders the app", async () => {
    await import("./index.tsx");

    const { initializeLogFile } = await import("./utils/chat-logger.js");
    expect(initializeLogFile).toHaveBeenCalledOnce();
  });
});
