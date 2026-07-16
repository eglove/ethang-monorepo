declare const send: (value: unknown) => void;
export const handler = (raw: unknown) => send(JSON.parse(raw as string));
