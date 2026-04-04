import every from "lodash/every.js";
import { describe, expect, it } from "vitest";

import { STAGES } from "../constants.ts";
import {
  createAllLegacyFlags,
  createDefaultFeatureFlags,
  isSdkEnabled,
} from "./feature-flags.ts";

describe("Feature Flags", () => {
  it("default flags enable SDK for all stages", () => {
    const flags = createDefaultFeatureFlags();
    for (const stage of STAGES) {
      expect(isSdkEnabled(flags, stage)).toBe(true);
    }
  });

  it("all legacy flags disable SDK for all stages", () => {
    const flags = createAllLegacyFlags();
    for (const stage of STAGES) {
      expect(isSdkEnabled(flags, stage)).toBe(false);
    }
  });

  it("mixed flags work correctly", () => {
    const flags = createDefaultFeatureFlags();
    flags.sdkEnabled.Questioner = false;
    flags.sdkEnabled.DebateModerator = true;

    expect(isSdkEnabled(flags, "Questioner")).toBe(false);
    expect(isSdkEnabled(flags, "DebateModerator")).toBe(true);
  });

  it("all flags enabled is equivalent to full SDK pipeline", () => {
    const flags = createDefaultFeatureFlags();
    const allEnabled = every(STAGES, (stage) => isSdkEnabled(flags, stage));
    expect(allEnabled).toBe(true);
  });

  it("all flags disabled is equivalent to legacy pipeline", () => {
    const flags = createAllLegacyFlags();
    const allDisabled = every(STAGES, (stage) => !isSdkEnabled(flags, stage));
    expect(allDisabled).toBe(true);
  });
});
