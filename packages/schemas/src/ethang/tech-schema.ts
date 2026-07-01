import { Schema } from "effect";

export class TechSchema extends Schema.Class<TechSchema>("Tech")({
  id: Schema.String,
  name: Schema.String
}) {}
