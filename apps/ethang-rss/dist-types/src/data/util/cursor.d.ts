import { Effect } from "effect";
export declare const encodeCursor: (value: [null | string, string]) => string;
export declare const decodeCursor: (cursor: string) => Effect.Effect<[null | string, string] | null>;
