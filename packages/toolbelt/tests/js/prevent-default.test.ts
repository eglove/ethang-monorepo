import { describe, expect, it, vi } from "vitest";

import { preventDefault } from "../../src/js/prevent-default.ts";

describe(preventDefault, () => {
  it("calls event.preventDefault and invokes the callback", () => {
    const mockEvent = { preventDefault: vi.fn() };
    const callback = vi.fn();

    preventDefault(callback)(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledOnce();
  });
});
