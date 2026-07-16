import { LogLevel } from "effect";
import isNil from "lodash/isNil.js";
import noop from "lodash/noop.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultLogLevel, installLogger } from "./logger.js";

describe("installLogger", () => {
  it("should run without throwing", () => {
    expect.assertions(1);
    expect(() => {
      installLogger();
    }).not.toThrow();
  });

  it("should be idempotent when called twice", () => {
    expect.assertions(1);
    const logSpy = vi.spyOn(console, "log").mockImplementation(noop);

    installLogger();
    installLogger();

    expect(logSpy).toBeDefined();
    logSpy.mockRestore();
  });
});

describe("defaultLogLevel", () => {
  const originalEnvironment = process.env["ENVIRONMENT"] ?? null;

  beforeEach(() => {
    delete process.env["ENVIRONMENT"];
  });

  afterEach(() => {
    if (isNil(originalEnvironment)) {
      delete process.env["ENVIRONMENT"];
    } else {
      process.env["ENVIRONMENT"] = originalEnvironment;
    }
  });

  it("should return LogLevel.Debug outside of production", () => {
    delete process.env["ENVIRONMENT"];
    expect(defaultLogLevel()).toBe(LogLevel.Debug);
  });

  it("should return LogLevel.Debug for any non-production environment", () => {
    process.env["ENVIRONMENT"] = "staging";
    expect(defaultLogLevel()).toBe(LogLevel.Debug);
  });

  it("should return LogLevel.Info in production", () => {
    process.env["ENVIRONMENT"] = "production";
    expect(defaultLogLevel()).toBe(LogLevel.Info);
  });
});
