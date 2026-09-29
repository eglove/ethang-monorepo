import { Schema } from "effect";
declare const UpdateApplicationChangesSchema_base: Schema.Class<UpdateApplicationChangesSchema, {
    appliedDate: Schema.optional<typeof Schema.String>;
    company: Schema.optional<typeof Schema.NonEmptyString>;
    id: typeof Schema.NonEmptyString;
    location: Schema.optionalWith<typeof Schema.String, {
        nullable: true;
    }>;
    nextInterviewDate: Schema.optionalWith<typeof Schema.String, {
        nullable: true;
    }>;
    notes: Schema.optionalWith<typeof Schema.String, {
        nullable: true;
    }>;
    salary: Schema.optionalWith<typeof Schema.String, {
        nullable: true;
    }>;
    status: Schema.optionalWith<Schema.Literal<["applied", "screening", "interview", "offer", "rejected", "withdrawn"]>, {
        nullable: true;
    }>;
    title: Schema.optional<typeof Schema.NonEmptyString>;
    token: typeof Schema.NonEmptyString;
}, Schema.Struct.Encoded<{
    appliedDate: Schema.optional<typeof Schema.String>;
    company: Schema.optional<typeof Schema.NonEmptyString>;
    id: typeof Schema.NonEmptyString;
    location: Schema.optionalWith<typeof Schema.String, {
        nullable: true;
    }>;
    nextInterviewDate: Schema.optionalWith<typeof Schema.String, {
        nullable: true;
    }>;
    notes: Schema.optionalWith<typeof Schema.String, {
        nullable: true;
    }>;
    salary: Schema.optionalWith<typeof Schema.String, {
        nullable: true;
    }>;
    status: Schema.optionalWith<Schema.Literal<["applied", "screening", "interview", "offer", "rejected", "withdrawn"]>, {
        nullable: true;
    }>;
    title: Schema.optional<typeof Schema.NonEmptyString>;
    token: typeof Schema.NonEmptyString;
}>, never, {
    readonly company?: string | undefined;
} & {
    readonly title?: string | undefined;
} & {
    readonly appliedDate?: string | undefined;
} & {
    readonly location?: string | undefined;
} & {
    readonly nextInterviewDate?: string | undefined;
} & {
    readonly notes?: string | undefined;
} & {
    readonly salary?: string | undefined;
} & {
    readonly status?: "applied" | "screening" | "interview" | "offer" | "rejected" | "withdrawn" | undefined;
} & {
    readonly token: string;
} & {
    readonly id: string;
}, {}, {}>;
export declare class UpdateApplicationChangesSchema extends UpdateApplicationChangesSchema_base {
}
export {};
