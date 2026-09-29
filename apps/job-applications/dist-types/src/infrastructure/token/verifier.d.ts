import { Layer } from "effect";
import { TokenVerifier } from "../../application/ports/token-verifier.ts";
export declare const createTokenVerifierLayer: (secret: string) => Layer.Layer<TokenVerifier, never, never>;
