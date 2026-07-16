declare const send: (value: { ok: boolean }) => void;
declare function parseThing(raw: string): { ok: boolean };
const raw = '{}' as string;
send(parseThing(raw));
