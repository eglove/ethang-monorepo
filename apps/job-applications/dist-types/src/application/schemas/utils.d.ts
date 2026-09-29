import { Effect, Schema } from "effect";
import { ValidationError } from "../../errors/validation-error.ts";
export declare const decodeInput: <I, A>(schema: Schema.Schema<A, I>, input: unknown) => Effect.Effect<A, ValidationError, never>;
