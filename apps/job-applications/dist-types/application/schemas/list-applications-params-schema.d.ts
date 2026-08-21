import { Schema } from "effect";
declare const ListApplicationsParamsSchema_base: Schema.Class<ListApplicationsParamsSchema, {
    after: Schema.optionalWith<Schema.transformOrFail<typeof Schema.NonEmptyString, Schema.Struct<{
        appliedDate: typeof Schema.NonEmptyString;
        id: typeof Schema.NonEmptyString;
    }>, never>, {
        nullable: true;
    }>;
    first: Schema.optionalWith<typeof Schema.Number, {
        default: () => number;
    }>;
    status: Schema.optionalWith<Schema.Literal<["applied", "screening", "interview", "offer", "rejected", "withdrawn"]>, {
        nullable: true;
    }>;
    token: typeof Schema.NonEmptyString;
}, Schema.Struct.Encoded<{
    after: Schema.optionalWith<Schema.transformOrFail<typeof Schema.NonEmptyString, Schema.Struct<{
        appliedDate: typeof Schema.NonEmptyString;
        id: typeof Schema.NonEmptyString;
    }>, never>, {
        nullable: true;
    }>;
    first: Schema.optionalWith<typeof Schema.Number, {
        default: () => number;
    }>;
    status: Schema.optionalWith<Schema.Literal<["applied", "screening", "interview", "offer", "rejected", "withdrawn"]>, {
        nullable: true;
    }>;
    token: typeof Schema.NonEmptyString;
}>, never, {
    readonly status?: "applied" | "screening" | "interview" | "offer" | "rejected" | "withdrawn" | undefined;
} & {
    readonly token: string;
} & {
    readonly after?: {
        readonly appliedDate: string;
        readonly id: string;
    } | undefined;
} & {
    readonly first?: number;
}, {}, {}>;
export declare class ListApplicationsParamsSchema extends ListApplicationsParamsSchema_base {
}
export {};
