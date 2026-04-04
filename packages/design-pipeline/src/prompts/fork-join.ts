import type { PairSessionResult } from "../schemas/index.ts";

export function buildForkJoinPrompt(pairResult: PairSessionResult): string {
  return `You are a fork-join coordinator. Generate final artifacts from pair session results.\n\nCompleted tasks: ${pairResult.completedTasks.join(", ")}\nTests passed: ${String(pairResult.testsPassed)}`;
}
