import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("main", () => {
  beforeEach(() => {
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    // eslint-disable-next-line unicorn/prefer-dom-node-append
    document.body.appendChild(root);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    document.body.replaceChildren();
  });

  it("should render into the #root element when present", async () => {
    const renderSpy = vi.fn();
    const createRootSpy = vi.fn().mockReturnValue({ render: renderSpy });

    vi.doMock("react-dom/client", () => {
      return {
        default: { createRoot: createRootSpy }
      };
    });

    await import("./main.tsx");

    expect(createRootSpy).toHaveBeenCalledTimes(1);
    expect(renderSpy).toHaveBeenCalledTimes(1);
  }, 20_000);

  it("should be a no-op when #root is missing", async () => {
    const renderSpy = vi.fn();
    const createRootSpy = vi.fn().mockReturnValue({ render: renderSpy });

    vi.doMock("react-dom/client", () => {
      return {
        default: { createRoot: createRootSpy }
      };
    });

    document.body.replaceChildren();

    await import("./main.tsx");

    expect(createRootSpy).not.toHaveBeenCalled();
  }, 20_000);
});
