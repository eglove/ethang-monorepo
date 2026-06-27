import { toolDefinition } from "@tanstack/ai";
import { Schema } from "effect";
import constant from "lodash/constant.js";

const SearchGraphInput = Schema.Struct({
  limit: Schema.withDefaults(Schema.optional(Schema.Number), {
    constructor: constant(10),
    decoding: constant(10)
  }),
  project: Schema.NonEmptyTrimmedString,
  query: Schema.NonEmptyTrimmedString
});

export const searchGraphTool = toolDefinition({
  description:
    "Search the code knowledge graph for functions, classes, routes, and variables using natural language.",
  inputSchema: Schema.standardSchemaV1(SearchGraphInput),
  name: "search_graph"
});
