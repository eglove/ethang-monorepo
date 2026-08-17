export const STATUSES = [
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "withdrawn"
] as const;

export type Status = (typeof STATUSES)[number];

const NEXT: Readonly<Record<Status, null | Status>> = {
  applied: "screening",
  interview: "offer",
  offer: null,
  rejected: null,
  screening: "interview",
  withdrawn: null
};

export const isStatus = (value: string): value is Status => {
  return (STATUSES as readonly string[]).includes(value);
};

export const nextStatus = (status: Status) => {
  return NEXT[status];
};
