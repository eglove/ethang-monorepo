// Feature flag removal plan: Remove stages 2-7 legacy flags after each stage
// is migrated to SDK-based orchestration. Track via individual stage migration.
import { type StageName, STAGES } from "../constants.ts";

export type FeatureFlags = {
  sdkEnabled: Record<StageName, boolean>;
};

export function createAllLegacyFlags(): FeatureFlags {
  const sdkEnabled: Partial<Record<StageName, boolean>> = {};
  for (const stage of STAGES) {
    sdkEnabled[stage] = false;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- all keys populated by loop above
  return { sdkEnabled: sdkEnabled as Record<StageName, boolean> };
}

export function createDefaultFeatureFlags(): FeatureFlags {
  const sdkEnabled: Partial<Record<StageName, boolean>> = {};
  for (const stage of STAGES) {
    sdkEnabled[stage] = true;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- all keys populated by loop above
  return { sdkEnabled: sdkEnabled as Record<StageName, boolean> };
}

export function isSdkEnabled(flags: FeatureFlags, stage: StageName): boolean {
  return flags.sdkEnabled[stage];
}
