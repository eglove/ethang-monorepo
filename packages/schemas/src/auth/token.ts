import { Schema } from "effect";

export type SignInResponse = Schema.Schema.Type<SignInResponseToken>;

export class SignInResponseToken extends Schema.Class<SignInResponseToken>(
  "SignInResponseToken"
)({
  email: Schema.String,
  id: Schema.String,
  lastLoggedIn: Schema.String,
  role: Schema.String,
  sessionToken: Schema.String,
  updatedAt: Schema.String,
  username: Schema.String
}) {}
