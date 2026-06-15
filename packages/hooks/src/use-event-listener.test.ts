import { renderHook } from "@testing-library/react";
import noop from "lodash/noop.js";
import { describe, expect, it, vi } from "vitest";

import { useEventListener } from "./use-event-listener.js";

describe(useEventListener, () => {
  it("should add event listener and react to event", () => {
    const listenerSpy = vi.fn(noop);
    renderHook(() => {
      useEventListener("click", listenerSpy);
    });

    const event = new MouseEvent("click");
    globalThis.dispatchEvent(event);

    expect(listenerSpy).toHaveBeenCalledWith(event);
  });

  it("should clean up event listener on unmount", () => {
    const listenerSpy = vi.fn(noop);
    const { unmount } = renderHook(() => {
      useEventListener("click", listenerSpy);
    });

    unmount();

    const event = new MouseEvent("click");
    globalThis.dispatchEvent(event);

    expect(listenerSpy).not.toHaveBeenCalled();
  });
});
