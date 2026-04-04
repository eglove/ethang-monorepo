import type { BriefingResult } from "../schemas/index.ts";

export function buildDebateModeratorPrompt(briefing: BriefingResult): string {
  return `You are a debate moderator. Synthesize expert opinions on the following briefing.\n\nSummary: ${briefing.summary}\nRequirements: ${briefing.requirements.join(", ")}\nConstraints: ${briefing.constraints.join(", ")}`;
}
