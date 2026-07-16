declare const obj: { decodeUnknown(v: unknown): unknown };
declare const value: unknown;
const data = obj.decodeUnknown(value);
