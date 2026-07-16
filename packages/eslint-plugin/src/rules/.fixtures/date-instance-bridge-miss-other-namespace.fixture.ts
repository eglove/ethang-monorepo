declare const Other: { toDate: () => Date }; const d = Other.toDate(); export const s = d.toUTCString();
