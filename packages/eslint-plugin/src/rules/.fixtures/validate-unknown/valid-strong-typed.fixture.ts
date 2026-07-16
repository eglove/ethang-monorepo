declare function parseThing(raw: string): { ok: boolean };
const raw = '{}' as string;
const data = parseThing(raw);
