import { vi } from "vitest";

export class MockLoggerClient {
  public error = vi.fn();
  public info = vi.fn();
}
