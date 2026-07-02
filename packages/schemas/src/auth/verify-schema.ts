import { Schema } from "effect";

import { emailSchema, passwordSchema } from "./schema-validators.ts";

export class VerifySchema extends Schema.Class<VerifySchema>("VerifySchema")({
  email: emailSchema,
  password: passwordSchema
}) {}

export const verifySchema = VerifySchema;
