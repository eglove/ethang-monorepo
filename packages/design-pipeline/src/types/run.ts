import { type StageName, STAGES } from "../constants.ts";
import {
  createEmptyStageRecord,
  type RunState,
  type StageRecord,
} from "./stage.ts";

export type RunRecord = {
  checkpoint: number;
  currentStage: number;
  stages: StageMap;
  state: RunState;
};

export type StageMap = Record<StageName, StageRecord>;

export function createRunRecord(): RunRecord {
  const stages: Partial<StageMap> = {};
  for (const stage of STAGES) {
    stages[stage] = createEmptyStageRecord();
  }
  return {
    checkpoint: 0,
    currentStage: 0,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- all keys populated by loop above
    stages: stages as StageMap,
    state: "idle",
  };
}
