import { Schema } from "effect";
declare const MySchema: Schema.Schema<string, string, never>;
export const handler = async (raw: Promise<unknown>) => Schema.decodeUnknownSync(MySchema)(await raw);
