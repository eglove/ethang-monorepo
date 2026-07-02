import { Schema } from "effect";

import { emailSchema, passwordSchema } from "./schema-validators.ts";

export class SignUpSchema extends Schema.Class<SignUpSchema>("SignUpSchema")({
  email: emailSchema,
  password: passwordSchema,
  username: Schema.optional(Schema.String)
}) {}

export const signUpSchema = SignUpSchema;
