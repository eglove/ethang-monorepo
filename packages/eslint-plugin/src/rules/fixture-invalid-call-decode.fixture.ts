declare function getSchema(): { decodeUnknown(v: unknown): unknown };
declare const value: unknown;
const data = getSchema().decodeUnknown(value);
