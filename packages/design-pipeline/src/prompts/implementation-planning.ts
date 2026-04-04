import type {
  BriefingResult,
  DebateSynthesis,
  TlaResult,
  TlaReviewSynthesis,
} from "../schemas/index.ts";

export type PlanningContext = {
  briefing: BriefingResult;
  debateSynthesis: DebateSynthesis;
  tlaResult: TlaResult;
  tlaReviewSynthesis: TlaReviewSynthesis;
};

export function buildImplementationPlanningPrompt(
  context: PlanningContext,
): string {
  return `You are an implementation planner. Create a detailed implementation plan from the following artifacts.\n\nBriefing: ${context.briefing.summary}\nConsensus: ${context.debateSynthesis.consensus}\nTLA+ Spec: ${context.tlaResult.tlaContent}\nReview: ${context.tlaReviewSynthesis.consensus}`;
}
