import { Schema } from "effect";
declare const CreateApplicationInputSchema_base: Schema.Class<CreateApplicationInputSchema, {
    applicationUrl: typeof Schema.NonEmptyString;
    appliedDate: typeof Schema.String;
    company: typeof Schema.NonEmptyString;
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
    title: typeof Schema.NonEmptyString;
    token: typeof Schema.NonEmptyString;
}, Schema.Struct.Encoded<{
    applicationUrl: typeof Schema.NonEmptyString;
    appliedDate: typeof Schema.String;
    company: typeof Schema.NonEmptyString;
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
    title: typeof Schema.NonEmptyString;
    token: typeof Schema.NonEmptyString;
}>, never, {
    readonly company: string;
} & {
    readonly title: string;
} & {
    readonly applicationUrl: string;
} & {
    readonly appliedDate: string;
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
}, {}, {}>;
export declare class CreateApplicationInputSchema extends CreateApplicationInputSchema_base {
}
export {};
