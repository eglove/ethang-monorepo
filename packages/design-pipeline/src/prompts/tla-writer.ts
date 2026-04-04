import type { DebateSynthesis } from "../schemas/index.ts";

export function buildTlaWriterPrompt(synthesis: DebateSynthesis): string {
  return `You are a TLA+ specification writer. Generate a formal TLA+ specification from the design consensus.\n\nConsensus: ${synthesis.consensus}\nRecommendations: ${synthesis.recommendations.join(", ")}`;
}
