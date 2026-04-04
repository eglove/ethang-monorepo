import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  BriefingResultSchema,
  DebateSynthesisSchema,
  ForkJoinResultSchema,
  ImplementationPlanSchema,
  PairSessionResultSchema,
  TlaResultSchema,
  TlaReviewSynthesisSchema,
} from "./index.ts";

describe("BriefingResultSchema", () => {
  it("accepts valid briefing", () => {
    const result = BriefingResultSchema.parse({
      constraints: ["constraint1"],
      requirements: ["req1", "req2"],
      summary: "Project summary",
    });
    expect(result.summary).toBe("Project summary");
  });

  it("rejects missing required fields", () => {
    expect(() => {
      BriefingResultSchema.parse({ summary: "only summary" });
    }).toThrow(z.ZodError);
  });

  it("rejects wrong field types", () => {
    expect(() => {
      BriefingResultSchema.parse({
        constraints: [],
        requirements: "not array",
        summary: 123,
      });
    }).toThrow(z.ZodError);
  });
});

describe("DebateSynthesisSchema", () => {
  it("accepts valid synthesis", () => {
    const result = DebateSynthesisSchema.parse({
      consensus: "Agreed approach",
      dissent: ["minor dissent"],
      recommendations: ["rec1"],
    });
    expect(result.consensus).toBe("Agreed approach");
  });

  it("rejects missing fields", () => {
    expect(() => {
      DebateSynthesisSchema.parse({});
    }).toThrow(z.ZodError);
  });
});

describe("TlaResultSchema", () => {
  it("accepts valid TLA+ result", () => {
    const result = TlaResultSchema.parse({
      cfgContent: "SPECIFICATION Spec",
      tlaContent: "---- MODULE Test ----",
      tlcOutput: "Model checking completed. No error.",
    });
    expect(result.tlaContent).toContain("MODULE");
  });

  it("rejects missing fields", () => {
    expect(() => {
      TlaResultSchema.parse({ tlaContent: "only tla" });
    }).toThrow(z.ZodError);
  });
});

describe("TlaReviewSynthesisSchema", () => {
  it("accepts valid review", () => {
    const result = TlaReviewSynthesisSchema.parse({
      amendments: ["amendment1"],
      consensus: "Spec is sound",
      gaps: ["gap1"],
    });
    expect(result.consensus).toBe("Spec is sound");
  });
});

describe("ImplementationPlanSchema", () => {
  it("accepts valid plan", () => {
    const result = ImplementationPlanSchema.parse({
      steps: [{ files: ["file.ts"], id: "T1", title: "Step 1" }],
      tiers: [{ taskIds: ["T1"], tier: 1 }],
    });
    expect(result.steps).toHaveLength(1);
  });

  it("rejects empty steps", () => {
    expect(() => {
      ImplementationPlanSchema.parse({ steps: [], tiers: [] });
    }).toThrow(z.ZodError);
  });
});

describe("PairSessionResultSchema", () => {
  it("accepts valid result with git metadata", () => {
    const result = PairSessionResultSchema.parse({
      branchName: "feature/test",
      commitMessage: "feat: implement T1",
      completedTasks: ["T1"],
      testsPassed: true,
    });
    expect(result.branchName).toBe("feature/test");
    expect(result.commitMessage).toBe("feat: implement T1");
  });

  it("requires git metadata fields", () => {
    expect(() => {
      PairSessionResultSchema.parse({
        completedTasks: ["T1"],
        testsPassed: true,
      });
    }).toThrow(z.ZodError);
  });
});

describe("ForkJoinResultSchema", () => {
  it("accepts valid result with git metadata", () => {
    const result = ForkJoinResultSchema.parse({
      branchName: "feature/fork-join",
      commitMessage: "feat: fork-join output",
      plantUml: "@startuml\n@enduml",
      reviewSummary: "All good",
    });
    expect(result.branchName).toBe("feature/fork-join");
  });

  it("requires git metadata fields", () => {
    expect(() => {
      ForkJoinResultSchema.parse({
        plantUml: "@startuml\n@enduml",
        reviewSummary: "All good",
      });
    }).toThrow(z.ZodError);
  });
});

describe("Git metadata presence", () => {
  it("PairSessionResult and ForkJoinResult have branchName and commitMessage", () => {
    expect(PairSessionResultSchema.shape).toHaveProperty("branchName");
    expect(PairSessionResultSchema.shape).toHaveProperty("commitMessage");
    expect(ForkJoinResultSchema.shape).toHaveProperty("branchName");
    expect(ForkJoinResultSchema.shape).toHaveProperty("commitMessage");
  });

  it("BriefingResult does NOT have git metadata", () => {
    expect(BriefingResultSchema.shape).not.toHaveProperty("branchName");
    expect(BriefingResultSchema.shape).not.toHaveProperty("commitMessage");
  });

  it("DebateSynthesis does NOT have git metadata", () => {
    expect(DebateSynthesisSchema.shape).not.toHaveProperty("branchName");
  });
});
