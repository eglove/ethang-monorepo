import { Schema } from "effect";

export type Token = Schema.Schema.Type<TokenSchema>;

export class TokenSchema extends Schema.Class<TokenSchema>("TokenSchema")({
  email: Schema.String,
  role: Schema.String,
  sub: Schema.String,
  username: Schema.String
}) {}
