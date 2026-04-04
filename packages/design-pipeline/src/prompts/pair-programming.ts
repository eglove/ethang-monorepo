import map from "lodash/map.js";

import type { ImplementationPlan } from "../schemas/index.ts";

export function buildPairProgrammingPrompt(plan: ImplementationPlan): string {
  return `You are a pair programming coordinator. Execute the implementation plan.\n\nSteps: ${map(plan.steps, "title").join(", ")}`;
}
