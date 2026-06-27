import { toolDefinition } from "@tanstack/ai";
import { Schema } from "effect";

const WebstormReadFileInput = Schema.Struct({
  file_path: Schema.NonEmptyTrimmedString
});

export const webstormReadFileTool = toolDefinition({
  description: "Read a file from the project using webstorm-mcp.",
  inputSchema: Schema.standardSchemaV1(WebstormReadFileInput),
  name: "webstorm_read_file"
});
