import { Schema } from "effect";

import { emailSchema, passwordSchema } from "./schema-validators.ts";

export class SignInSchema extends Schema.Class<SignInSchema>("SignInSchema")({
  email: emailSchema,
  password: passwordSchema
}) {}

export const signInSchema = SignInSchema;
