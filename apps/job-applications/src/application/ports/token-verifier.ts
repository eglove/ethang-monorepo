import { Context, type Effect } from "effect";

import type { TokenError } from "../../errors/token-error.ts";

export class TokenVerifier extends Context.Tag("TokenVerifier")<
  TokenVerifier,
  {
    readonly verify: (token: string) => Effect.Effect<string, TokenError>;
  }
>() {}
