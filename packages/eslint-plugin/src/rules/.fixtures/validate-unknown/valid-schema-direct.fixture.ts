import { Schema } from "effect";
declare const MySchema: Schema.Schema<string, string, never>;
declare const value: unknown;
Schema.decodeUnknownSync(MySchema)(value);
