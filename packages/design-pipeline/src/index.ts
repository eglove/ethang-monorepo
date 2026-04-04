import path from "node:path";

import { ClaudeSdkAdapter } from "./adapters/claude-sdk.ts";
import { ChildProcessGitAdapter } from "./adapters/git-child-process.ts";
import { defaultPipelineConfig } from "./constants.ts";
import {
  executeOrchestrator,
  type PipelineResult,
} from "./engine/orchestrator.ts";

const MONOREPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..");

export async function runPipeline(): Promise<PipelineResult> {
  const claudeAdapter = new ClaudeSdkAdapter();
  const gitAdapter = new ChildProcessGitAdapter(MONOREPO_ROOT);

  return executeOrchestrator({
    claudeAdapter,
    config: defaultPipelineConfig,
    gitAdapter,
  });
}

export { defaultPipelineConfig, type PipelineConfig } from "./constants.ts";
export {
  executeOrchestrator,
  type PipelineResult,
} from "./engine/orchestrator.ts";
