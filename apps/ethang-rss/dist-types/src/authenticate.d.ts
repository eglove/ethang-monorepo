import { Data, Effect } from "effect";
export type User = {
    email: string;
    exp: number;
    iat: number;
    sub: string;
    username: string;
};
export declare class UnauthorizedError extends Data.Error<{
    readonly message: string;
}> {
    name: string;
}
export declare const authenticate: (request: Request) => Effect.Effect<{
    readonly email: string;
    readonly exp: number;
    readonly iat: number;
    readonly sub: string;
    readonly username: string;
}, UnauthorizedError, never>;
