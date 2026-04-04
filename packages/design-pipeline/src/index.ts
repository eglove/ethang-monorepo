import Anthropic from "@anthropic-ai/sdk";
import isError from "lodash/isError.js";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { createInterface } from "node:readline";

import type { EslintRunner } from "./stages/lint-fixer.ts";

import { ClaudeSdkAdapter } from "./adapters/claude-sdk.ts";
import { ChildProcessGitAdapter } from "./adapters/git-child-process.ts";
import { defaultPipelineConfig } from "./constants.ts";
import {
  executeOrchestrator,
  type PipelineResult,
} from "./engine/orchestrator.ts";
import { runQuestionerSession } from "./stages/questioner-session.ts";

const MONOREPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..");

export async function runPipeline(topic = "pipeline"): Promise<PipelineResult> {
  const claudeAdapter = new ClaudeSdkAdapter();
  const gitAdapter = new ChildProcessGitAdapter(MONOREPO_ROOT);
  const anthropicClient = new Anthropic();

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const readlinePort = {
    close(): void {
      rl.close();
    },
    async question(prompt: string): Promise<string> {
      return new Promise((resolve) => {
        rl.question(prompt, resolve);
      });
    },
  };

  const eslintRunner: EslintRunner = {
    fix(filePath: string): { clean: boolean; errors: string } {
      try {
        // eslint-disable-next-line sonar/no-os-command-from-path -- CLI entry point, npx resolved from project node_modules
        execFileSync("npx", ["eslint", "--fix", filePath], {
          encoding: "utf8",
          shell: true,
        });
        return { clean: true, errors: "" };
      } catch (error: unknown) {
        const message = isError(error) ? error.message : String(error);
        return { clean: false, errors: message };
      }
    },
  };

  return executeOrchestrator({
    anthropicClient,
    claudeAdapter,
    config: defaultPipelineConfig,
    eslintRunner,
    gitAdapter,
    questionerRunner: async (deps) => {
      return runQuestionerSession({
        ...deps,
        client: anthropicClient,
        readline: readlinePort,
        rootDirectory: MONOREPO_ROOT,
        topic,
      });
    },
    readlinePort,
    rootDirectory: MONOREPO_ROOT,
  });
}

export { defaultPipelineConfig, type PipelineConfig } from "./constants.ts";
export {
  executeOrchestrator,
  type PipelineResult,
} from "./engine/orchestrator.ts";
