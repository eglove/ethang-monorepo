import { Context, type Effect } from "effect";
import type { TokenError } from "../../errors/token-error.ts";
declare const TokenVerifier_base: Context.TagClass<TokenVerifier, "TokenVerifier", {
    readonly verify: (token: string) => Effect.Effect<string, TokenError>;
}>;
export declare class TokenVerifier extends TokenVerifier_base {
}
export {};
