import { Schema } from "effect";

import { emailSchema, passwordSchema } from "./schema-validators.ts";

export class UserSchema extends Schema.Class<UserSchema>("UserSchema")({
  createdAt: Schema.String,
  email: emailSchema,
  lastLoggedIn: Schema.NullOr(Schema.String),
  password: passwordSchema,
  role: Schema.NullOr(Schema.String),
  updatedAt: Schema.String,
  username: Schema.String
}) {}

export const userSchema = UserSchema;
