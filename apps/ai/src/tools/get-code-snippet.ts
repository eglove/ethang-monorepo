import { toolDefinition } from "@tanstack/ai";
import { Schema } from "effect";

const CodeSnippetInput = Schema.Struct({
  project: Schema.NonEmptyTrimmedString,
  qualified_name: Schema.NonEmptyTrimmedString
});

export const codeSnippetTool = toolDefinition({
  description: "Read source code for a specific function or class.",
  inputSchema: Schema.standardSchemaV1(CodeSnippetInput),
  name: "get_code_snippet"
});
