import { z } from "zod";

const FileEntrySchema = z.object({
  action: z.enum(["create", "modify"]),
  path: z.string().min(1),
});

const TlaCoverageSchema = z
  .object({
    invariants: z.array(z.string()),
    properties: z.array(z.string()),
    states: z.array(z.string()),
    transitions: z.array(z.string()),
  })
  .refine((coverage) => {
    return (
      0 <
      coverage.states.length +
        coverage.transitions.length +
        coverage.invariants.length +
        coverage.properties.length
    );
  }, "must map to at least one TLA+ spec element");

export const TrainerInputSchema = z.object({
  dependencies: z.array(z.number().int().min(1)),
  description: z.string().min(1),
  files: z.array(FileEntrySchema).min(1),
  stepNumber: z.number().int().min(1),
  testDescription: z.string().min(1),
  title: z.string().min(1),
  tlaCoverage: TlaCoverageSchema,
});
