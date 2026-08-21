import { Effect } from "effect";
export type ErrorCode = "DUPLICATE" | "INTERNAL" | "INVALID_TRANSITION" | "NOT_FOUND" | "RESUME" | "UNAUTHENTICATED" | "VALIDATION";
export type RpcResult<T> = {
    readonly error: {
        readonly code: ErrorCode;
        readonly message: string;
    };
    readonly ok: false;
} | {
    readonly ok: true;
    readonly value: T;
};
export declare const toResult: <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<{
    error: {
        code: ErrorCode;
        message: string;
    };
    ok: false;
} | {
    ok: true;
    value: A;
}, never, R>;
