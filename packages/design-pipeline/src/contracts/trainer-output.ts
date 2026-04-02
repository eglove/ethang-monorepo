import { z } from "zod";

import { FrontmatterSchema } from "./shared/frontmatter.ts";
import { HandoffContractSchema } from "./shared/handoff-contract.ts";
import { SectionSchema } from "./shared/section.ts";

const ManifestEntrySchema = z.object({
  action: z.enum(["create", "modify"]),
  filePath: z.string().min(1),
});

const ARTIFACT_TYPES = ["skill", "agent", "hook", "orchestrator"] as const;

const HANDOFF_REQUIRED_TYPES = new Set<string>([
  "agent",
  "orchestrator",
  "skill",
]);

const BaseTrainerOutputSchema = z.object({
  artifactType: z.enum(ARTIFACT_TYPES),
  frontmatter: FrontmatterSchema,
  handoff: HandoffContractSchema.optional(),
  manifest: z.array(ManifestEntrySchema).min(1),
  noTbdPlaceholders: z.literal(true),
  sections: z.array(SectionSchema).min(1),
});

export const TrainerOutputSchema = BaseTrainerOutputSchema.refine(
  (output) => {
    if (HANDOFF_REQUIRED_TYPES.has(output.artifactType)) {
      return output.handoff !== undefined;
    }

    return true;
  },
  {
    message:
      "handoff contract is required for skill, agent, and orchestrator artifact types",
    path: ["handoff"],
  },
);
