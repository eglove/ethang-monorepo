import { describe, expect, it } from "vitest";

import { type RetryConfig, retryWithBackoff } from "./retry.ts";

const defaultConfig: RetryConfig = {
  baseDelayMs: 100,
  maxDelayMs: 10_000,
  maxRetries: 3,
};

describe("retryWithBackoff", () => {
  it("returns exhausted false and delay in [0, 100] for retry 0", () => {
    const result = retryWithBackoff(0, defaultConfig);
    expect(result.exhausted).toBe(false);
    expect(result.delayMs).toBeGreaterThanOrEqual(0);
    expect(result.delayMs).toBeLessThanOrEqual(100);
  });

  it("returns exhausted true when currentRetry equals maxRetries", () => {
    const result = retryWithBackoff(3, defaultConfig);
    expect(result.exhausted).toBe(true);
  });

  it("returns exhausted true when currentRetry exceeds maxRetries", () => {
    const result = retryWithBackoff(5, defaultConfig);
    expect(result.exhausted).toBe(true);
  });

  it("delay never exceeds maxDelayMs", () => {
    for (let index = 0; 100 > index; index += 1) {
      const result = retryWithBackoff(2, defaultConfig);
      expect(result.delayMs).toBeLessThanOrEqual(defaultConfig.maxDelayMs);
    }
  });

  it("delay is non-negative", () => {
    for (let index = 0; 100 > index; index += 1) {
      const result = retryWithBackoff(1, defaultConfig);
      expect(result.delayMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("produces varying delays (jitter)", () => {
    const delays = new Set<number>();
    for (let index = 0; 50 > index; index += 1) {
      const result = retryWithBackoff(2, defaultConfig);
      delays.add(result.delayMs);
    }

    // With full jitter over [0, 400], 50 samples should produce more than 1 unique value
    expect(delays.size).toBeGreaterThan(1);
  });

  it("retry 2 has delay in [0, 400]", () => {
    for (let index = 0; 100 > index; index += 1) {
      const result = retryWithBackoff(2, defaultConfig);
      expect(result.exhausted).toBe(false);
      expect(result.delayMs).toBeGreaterThanOrEqual(0);
      expect(result.delayMs).toBeLessThanOrEqual(400);
    }
  });

  it("caps delay at maxDelayMs even with high retry count", () => {
    const config: RetryConfig = {
      baseDelayMs: 1000,
      maxDelayMs: 5000,
      maxRetries: 20,
    };

    for (let index = 0; 50 > index; index += 1) {
      const result = retryWithBackoff(15, config);
      expect(result.delayMs).toBeLessThanOrEqual(5000);
    }
  });

  it("delay is always an integer", () => {
    for (let index = 0; 50 > index; index += 1) {
      const result = retryWithBackoff(1, defaultConfig);
      expect(Number.isInteger(result.delayMs)).toBe(true);
    }
  });
});
