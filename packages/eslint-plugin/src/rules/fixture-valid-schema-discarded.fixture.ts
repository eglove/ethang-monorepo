import { Schema } from "effect";
declare const MySchema: Schema.Schema<string, string, never>;
const raw = '{}' as string;
Schema.decodeUnknownSync(MySchema)(JSON.parse(raw));
