import { type PipelineState, PipelineStore } from "./pipeline-store.ts";

export class TestPipelineStore extends PipelineStore {
  public forceState(updater: (draft: PipelineState) => void): void {
    this.update(updater);
  }
}
