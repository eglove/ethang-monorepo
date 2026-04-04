import type { TlaResult } from "../schemas/index.ts";

export function buildExpertReviewPrompt(tlaResult: TlaResult): string {
  return `You are a TLA+ expert reviewer. Review the following specification for correctness and completeness.\n\nTLA+ Content:\n${tlaResult.tlaContent}\n\nCfg Content:\n${tlaResult.cfgContent}\n\nTLC Output:\n${tlaResult.tlcOutput}`;
}
