import { vi } from "vitest";

export class MockIntersectionObserver {
  public static get callback() {
    return this.observerCallback;
  }

  public static set callback(
    value: ((entries: { isIntersecting: boolean }[]) => void) | null
  ) {
    this.observerCallback = value;
  }

  private static observerCallback:
    | ((entries: { isIntersecting: boolean }[]) => void)
    | null = null;

  public disconnect = vi.fn();

  public observe = vi.fn();

  public constructor(
    callback: (entries: { isIntersecting: boolean }[]) => void
  ) {
    MockIntersectionObserver.callback = callback;
  }
}
