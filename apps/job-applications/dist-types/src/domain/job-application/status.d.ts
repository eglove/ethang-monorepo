export declare const STATUSES: readonly ["applied", "screening", "interview", "offer", "rejected", "withdrawn"];
export type Status = (typeof STATUSES)[number];
export declare const isStatus: (value: string) => value is Status;
export declare const nextStatus: (status: Status) => "applied" | "screening" | "interview" | "offer" | "rejected" | "withdrawn" | null;
