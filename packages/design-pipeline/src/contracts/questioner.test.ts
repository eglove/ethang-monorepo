import some from "lodash/some.js";
import { describe, expect, it } from "vitest";

import {
  decisionGuideRowSchema,
  dispatchTargetListSchema,
} from "./questioner.ts";

const DISPATCH_TARGETS = ["debate-moderator"];

const DECISION_GUIDE_ROWS = [
  {
    recommendation:
      'Ask single opening question: "What would you like to design or plan?"',
    trigger: "No seed provided",
  },
  {
    recommendation:
      "Recommend /design-pipeline as entry point — agent artifact creation goes through the full pipeline",
    trigger: "User describes agent/skill artifacts",
  },
];

describe("questioner contract", () => {
  describe("dispatch target list", () => {
    it("should validate against the dispatch target list schema", () => {
      const result = dispatchTargetListSchema.safeParse(DISPATCH_TARGETS);
      expect(result.success).toBe(true);
    });

    it("should not include trainer as a dispatch target", () => {
      expect(DISPATCH_TARGETS).not.toContain("trainer");
    });

    it("should still include debate-moderator as a dispatch target", () => {
      expect(DISPATCH_TARGETS).toContain("debate-moderator");
    });
  });

  describe("decision guide", () => {
    it("should validate each row against the decision guide row schema", () => {
      for (const row of DECISION_GUIDE_ROWS) {
        const result = decisionGuideRowSchema.safeParse(row);
        expect(result.success).toBe(true);
      }
    });

    it("should include a row where trigger matches agent/skill artifacts and recommendation includes /design-pipeline", () => {
      const DESIGN_PIPELINE = "/design-pipeline";
      const hasDesignPipelineRow = some(DECISION_GUIDE_ROWS, (row) => {
        return (
          /agent.*skill|skill.*artifact/iu.test(row.trigger) &&
          // eslint-disable-next-line lodash/prefer-lodash-method -- lodash includes causes no-unsafe-call with string args
          row.recommendation.includes(DESIGN_PIPELINE)
        );
      });

      expect(hasDesignPipelineRow).toBe(true);
    });
  });
});
