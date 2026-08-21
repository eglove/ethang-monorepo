import { Schema } from "effect";
export declare const ApplicationCursorSchema: Schema.Struct<{
    appliedDate: typeof Schema.NonEmptyString;
    id: typeof Schema.NonEmptyString;
}>;
export type ApplicationCursor = Schema.Schema.Type<typeof ApplicationCursorSchema>;
export declare const encodeApplicationCursor: (cursor: ApplicationCursor) => string;
export declare const parseCursorParts: (parts: readonly unknown[]) => {
    appliedDate: string;
    id: string;
} | null;
export declare const decodeApplicationCursor: (value: null | string | undefined) => {
    appliedDate: string;
    id: string;
} | null;
export declare const ApplicationCursorFromEncoded: Schema.transformOrFail<typeof Schema.NonEmptyString, Schema.Struct<{
    appliedDate: typeof Schema.NonEmptyString;
    id: typeof Schema.NonEmptyString;
}>, never>;
