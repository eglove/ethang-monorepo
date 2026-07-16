import { S } from "effect";
declare const MySchema: S.Schema<string, string, never>;
const raw = '{}' as string;
const data = S.decodeUnknownSync(MySchema)(JSON.parse(raw));
