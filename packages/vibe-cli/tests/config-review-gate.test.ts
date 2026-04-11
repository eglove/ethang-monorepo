/**
 * T1: Review Gate Constants and NumTasks
 *
 * RED-phase Vitest tests for the TypeScript port of utils/config.ps1.
 * These tests define the behavioral contract for review gate constants,
 * environment variable overrides, NumTasks validation, and config immutability.
 *
 * TLA+ coverage:
 *   Constants: MaxReviewRounds, MaxKeepGoingResets, MaxTddKeepGoingPerGate, NumTasks
 *   Invariant: S11 (MaxKeepGoingResets=0 disables Keep Going)
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_CONFIG,
  getPipelineConfig,
} from "../utils/config.ts";

// ---------------------------------------------------------------------------
// 1. Review gate constants — defaults
// ---------------------------------------------------------------------------
describe("Review gate constants — defaults", () => {
  it("exposes MaxReviewRounds with default value 3", () => {
    expect(DEFAULT_CONFIG.MaxReviewRounds).toBe(3);
  });

  it("exposes MaxKeepGoingResets with default value 3", () => {
    expect(DEFAULT_CONFIG.MaxKeepGoingResets).toBe(3);
  });

  it("exposes MaxTddKeepGoingPerGate with default value 5", () => {
    expect(DEFAULT_CONFIG.MaxTddKeepGoingPerGate).toBe(5);
  });

  it("exposes ReviewGateTimeoutSeconds with default value 1800", () => {
    expect(DEFAULT_CONFIG.ReviewGateTimeoutSeconds).toBe(1800);
  });

  it("retains existing PipelineTimeoutSeconds at 14400", () => {
    expect(DEFAULT_CONFIG.PipelineTimeoutSeconds).toBe(14_400);
  });
});

// ---------------------------------------------------------------------------
// 2. NumTasks derivation
// ---------------------------------------------------------------------------
describe("NumTasks derivation", () => {
  it("includes NumTasks in the config", () => {
    expect(DEFAULT_CONFIG).toHaveProperty("NumTasks");
  });

  it("defaults NumTasks to at least 1", () => {
    expect(DEFAULT_CONFIG.NumTasks).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// 3. getPipelineConfig returns review gate constants
// ---------------------------------------------------------------------------
describe("getPipelineConfig returns review gate constants", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns MaxReviewRounds with default value", () => {
    const config = getPipelineConfig();
    expect(config.MaxReviewRounds).toBe(3);
  });

  it("returns MaxKeepGoingResets with default value", () => {
    const config = getPipelineConfig();
    expect(config.MaxKeepGoingResets).toBe(3);
  });

  it("returns MaxTddKeepGoingPerGate with default value", () => {
    const config = getPipelineConfig();
    expect(config.MaxTddKeepGoingPerGate).toBe(5);
  });

  it("returns ReviewGateTimeoutSeconds with default value", () => {
    const config = getPipelineConfig();
    expect(config.ReviewGateTimeoutSeconds).toBe(1800);
  });

  it("returns NumTasks >= 1", () => {
    const config = getPipelineConfig();
    expect(config.NumTasks).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// 4. Environment variable overrides
// ---------------------------------------------------------------------------
describe("Environment variable overrides", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("overrides MaxReviewRounds from VIBE_MAX_REVIEW_ROUNDS", () => {
    vi.stubEnv("VIBE_MAX_REVIEW_ROUNDS", "5");
    const config = getPipelineConfig();
    expect(config.MaxReviewRounds).toBe(5);
  });

  it("overrides MaxKeepGoingResets from VIBE_MAX_KEEP_GOING_RESETS", () => {
    vi.stubEnv("VIBE_MAX_KEEP_GOING_RESETS", "7");
    const config = getPipelineConfig();
    expect(config.MaxKeepGoingResets).toBe(7);
  });

  it("overrides MaxTddKeepGoingPerGate from VIBE_MAX_TDD_KEEP_GOING_PER_GATE", () => {
    vi.stubEnv("VIBE_MAX_TDD_KEEP_GOING_PER_GATE", "10");
    const config = getPipelineConfig();
    expect(config.MaxTddKeepGoingPerGate).toBe(10);
  });

  it("overrides ReviewGateTimeoutSeconds from VIBE_REVIEW_GATE_TIMEOUT_SECONDS", () => {
    vi.stubEnv("VIBE_REVIEW_GATE_TIMEOUT_SECONDS", "3600");
    const config = getPipelineConfig();
    expect(config.ReviewGateTimeoutSeconds).toBe(3600);
  });

  it("overrides NumTasks from VIBE_NUM_TASKS", () => {
    vi.stubEnv("VIBE_NUM_TASKS", "4");
    const config = getPipelineConfig();
    expect(config.NumTasks).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// 5. Boundary — zero values
// ---------------------------------------------------------------------------
describe("Boundary — zero values", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts MaxReviewRounds=0 (immediate escalation)", () => {
    vi.stubEnv("VIBE_MAX_REVIEW_ROUNDS", "0");
    const config = getPipelineConfig();
    expect(config.MaxReviewRounds).toBe(0);
  });

  it("accepts MaxKeepGoingResets=0 to disable Keep Going (S11 invariant)", () => {
    vi.stubEnv("VIBE_MAX_KEEP_GOING_RESETS", "0");
    const config = getPipelineConfig();
    expect(config.MaxKeepGoingResets).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 6. NumTasks validation
// ---------------------------------------------------------------------------
describe("NumTasks validation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts NumTasks=1 for single-task tiers", () => {
    vi.stubEnv("VIBE_NUM_TASKS", "1");
    const config = getPipelineConfig();
    expect(config.NumTasks).toBe(1);
  });

  it("accepts NumTasks=3 for multi-task tiers", () => {
    vi.stubEnv("VIBE_NUM_TASKS", "3");
    const config = getPipelineConfig();
    expect(config.NumTasks).toBe(3);
  });

  it("throws when NumTasks=0", () => {
    vi.stubEnv("VIBE_NUM_TASKS", "0");
    expect(() => getPipelineConfig()).toThrow(/NumTasks/);
  });

  it("throws when NumTasks is negative", () => {
    vi.stubEnv("VIBE_NUM_TASKS", "-1");
    expect(() => getPipelineConfig()).toThrow(/NumTasks/);
  });
});

// ---------------------------------------------------------------------------
// 7. Config immutability
// ---------------------------------------------------------------------------
describe("Config immutability after initialization", () => {
  it("returns a frozen object from getPipelineConfig", () => {
    const config = getPipelineConfig();
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("throws when attempting to modify an existing property", () => {
    const config = getPipelineConfig();
    expect(() => {
      (config as Record<string, unknown>).MaxReviewRounds = 999;
    }).toThrow();
  });

  it("throws when attempting to add a new property", () => {
    const config = getPipelineConfig();
    expect(() => {
      (config as Record<string, unknown>).SomeNewKey = 42;
    }).toThrow();
  });

  it("throws when attempting to delete a property", () => {
    const config = getPipelineConfig();
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (config as Record<string, unknown>).MaxReviewRounds;
    }).toThrow();
  });
});
