import { Schema } from "effect";
declare const ListApplicationsParamsSchema_base: Schema.Class<ListApplicationsParamsSchema, {
    appliedDate: Schema.filter<typeof Schema.NonEmptyString>;
    status: Schema.optionalWith<Schema.Literal<["applied", "screening", "interview", "offer", "rejected", "withdrawn"]>, {
        nullable: true;
    }>;
    token: typeof Schema.NonEmptyString;
}, Schema.Struct.Encoded<{
    appliedDate: Schema.filter<typeof Schema.NonEmptyString>;
    status: Schema.optionalWith<Schema.Literal<["applied", "screening", "interview", "offer", "rejected", "withdrawn"]>, {
        nullable: true;
    }>;
    token: typeof Schema.NonEmptyString;
}>, never, {
    readonly appliedDate: string;
} & {
    readonly status?: "applied" | "screening" | "interview" | "offer" | "rejected" | "withdrawn" | undefined;
} & {
    readonly token: string;
}, {}, {}>;
export declare class ListApplicationsParamsSchema extends ListApplicationsParamsSchema_base {
}
export {};
