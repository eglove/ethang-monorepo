declare const DateTime: { toDate: () => Date }; const d = DateTime['toDate'](); export const s = d.toUTCString();
