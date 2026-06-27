import { toolDefinition } from "@tanstack/ai";
import { Schema } from "effect";

const literal = Schema.Literal("inbound", "outbound", "both");

const TracePathInput = Schema.Struct({
  direction: Schema.withDefaults(Schema.optional(literal), {
    constructor: () => {
      return "both" as const;
    },
    decoding: () => {
      return "both" as const;
    }
  }),
  function_name: Schema.NonEmptyTrimmedString,
  project: Schema.NonEmptyTrimmedString
});

export const tracePathTool = toolDefinition({
  description:
    "Trace call paths through the code graph to understand execution flow.",
  inputSchema: Schema.standardSchemaV1(TracePathInput),
  name: "trace_path"
});
