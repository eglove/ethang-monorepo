import { Schema } from "effect";

import { TechSchema } from "./tech-schema.ts";

export type ProjectType = Schema.Schema.Type<Project>;

export class Project extends Schema.Class<Project>("Project")({
  code: Schema.String,
  description: Schema.String,
  id: Schema.String,
  publicUrl: Schema.optional(Schema.NullOr(Schema.String)),
  techs: Schema.Array(TechSchema),
  title: Schema.String
}) {}
