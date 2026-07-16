import { Schema } from "effect";
declare const MySchema: Schema.Schema<string, string, never>;
declare const value: unknown;
const data = Schema["decodeUnknownSync"](MySchema)(value);
