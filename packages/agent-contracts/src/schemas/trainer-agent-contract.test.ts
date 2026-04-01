import { describe, expect, it } from "vitest";
import { z } from "zod";

import { TrainerInputSchema } from "./trainer-input.ts";

const QUESTIONER_BRIEFING = "questioner-briefing";
const IMPLEMENTATION_STEP = "implementation-step";

const inputShapeSchema = z.object({
  description: z.string().min(1),
  name: z.string().min(1),
});

const trainerAgentContractSchema = z.object({
  inputShapes: z.array(inputShapeSchema),
  orient: z.object({
    referencedInputShapes: z.array(z.string().min(1)),
  }),
});

const trainerAgentFixture = {
  inputShapes: [
    {
      description:
        "Structured Markdown briefing file path produced by a /questioner session",
      name: QUESTIONER_BRIEFING,
    },
    {
      description:
        "Task assignment row from the implementation-writer agent containing step number, title, files, description, dependencies, test description, and TLA+ coverage",
      name: IMPLEMENTATION_STEP,
    },
  ],
  orient: {
    referencedInputShapes: [QUESTIONER_BRIEFING, IMPLEMENTATION_STEP],
  },
};

const implementationStepSample = {
  dependencies: [1, 2],
  description: "Add validation logic for order creation",
  files: [
    { action: "modify" as const, path: "src/domain/order.ts" },
    { action: "create" as const, path: "src/domain/order.test.ts" },
  ],
  stepNumber: 3,
  testDescription: "Verify order rejects negative quantities",
  title: "Order creation validation",
  tlaCoverage: {
    invariants: [],
    properties: [],
    states: ["Draft"],
    transitions: ["CreateOrder"],
  },
};

describe("trainer agent contract", () => {
  it("includes exactly 2 input shapes", () => {
    expect(trainerAgentFixture.inputShapes).toHaveLength(2);
  });

  it("declares questioner-briefing and implementation-step shapes", () => {
    const shapeNames = trainerAgentFixture.inputShapes.map((s) => {
      return s.name;
    });

    expect(shapeNames).toContain(QUESTIONER_BRIEFING);
    expect(shapeNames).toContain(IMPLEMENTATION_STEP);
  });

  it("validates the fixture against the contract schema", () => {
    const result = trainerAgentContractSchema.safeParse(trainerAgentFixture);

    expect(result.success).toBe(true);
  });

  it("validates implementation-step sample against TrainerInputSchema", () => {
    const result = TrainerInputSchema.safeParse(implementationStepSample);

    expect(result.success).toBe(true);
  });

  it("orient phase references both input shapes", () => {
    const { referencedInputShapes } = trainerAgentFixture.orient;

    expect(referencedInputShapes).toContain(QUESTIONER_BRIEFING);
    expect(referencedInputShapes).toContain(IMPLEMENTATION_STEP);
    expect(referencedInputShapes).toHaveLength(2);
  });
});
