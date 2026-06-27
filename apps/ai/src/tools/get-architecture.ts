import { toolDefinition } from "@tanstack/ai";
import { Schema } from "effect";

const ArchitectureInput = Schema.Struct({
  project: Schema.NonEmptyTrimmedString
});

export const architectureTool = toolDefinition({
  description:
    "Get high-level architecture overview including packages, services, dependencies, and clusters.",
  inputSchema: Schema.standardSchemaV1(ArchitectureInput),
  name: "get_architecture"
});
