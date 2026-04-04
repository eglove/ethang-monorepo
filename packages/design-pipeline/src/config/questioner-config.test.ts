import { describe, expect, it } from "vitest";

import { createQuestionerConfig } from "./questioner-config.ts";

describe("Questioner Config", () => {
  it("returns correct defaults", () => {
    const config = createQuestionerConfig();
    expect(config).toStrictEqual({
      maxLintPasses: 10,
      maxRetries: 3,
      maxSignoffAttempts: 3,
      maxTurns: 50,
      retryBaseDelayMs: 1000,
    });
  });

  it("overrides only the specified field", () => {
    const config = createQuestionerConfig({ maxTurns: 5 });
    expect(config.maxTurns).toBe(5);
    expect(config.maxRetries).toBe(3);
    expect(config.maxSignoffAttempts).toBe(3);
    expect(config.maxLintPasses).toBe(10);
    expect(config.retryBaseDelayMs).toBe(1000);
  });

  it("all partial overrides work independently", () => {
    const overrides: [string, number][] = [
      ["maxLintPasses", 2],
      ["maxRetries", 5],
      ["maxSignoffAttempts", 7],
      ["maxTurns", 10],
      ["retryBaseDelayMs", 500],
    ];

    for (const [key, value] of overrides) {
      const config = createQuestionerConfig({ [key]: value });
      expect(config).toHaveProperty(key, value);
    }
  });

  it("rejects 0 for min-1 fields", () => {
    expect(() => createQuestionerConfig({ maxRetries: 0 })).toThrow();
    expect(() => createQuestionerConfig({ maxTurns: 0 })).toThrow();
    expect(() => createQuestionerConfig({ maxSignoffAttempts: 0 })).toThrow();
    expect(() => createQuestionerConfig({ maxLintPasses: 0 })).toThrow();
  });

  it("allows 0 for retryBaseDelayMs", () => {
    const config = createQuestionerConfig({ retryBaseDelayMs: 0 });
    expect(config.retryBaseDelayMs).toBe(0);
  });

  it("rejects negative values", () => {
    expect(() => createQuestionerConfig({ maxRetries: -1 })).toThrow();
    expect(() => createQuestionerConfig({ maxTurns: -1 })).toThrow();
    expect(() => createQuestionerConfig({ maxSignoffAttempts: -1 })).toThrow();
    expect(() => createQuestionerConfig({ maxLintPasses: -1 })).toThrow();
    expect(() => createQuestionerConfig({ retryBaseDelayMs: -1 })).toThrow();
  });

  it("rejects non-integer values", () => {
    expect(() => createQuestionerConfig({ maxRetries: 1.5 })).toThrow();
    expect(() => createQuestionerConfig({ maxTurns: 2.7 })).toThrow();
    expect(() => createQuestionerConfig({ maxSignoffAttempts: 0.5 })).toThrow();
    expect(() => createQuestionerConfig({ maxLintPasses: 3.3 })).toThrow();
    expect(() => createQuestionerConfig({ retryBaseDelayMs: 1.1 })).toThrow();
  });
});
