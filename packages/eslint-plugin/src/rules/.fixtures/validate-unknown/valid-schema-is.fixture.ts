import { Schema } from "effect";
declare const MySchema: Schema.Schema<string, string, never>;
const raw = '{}' as string;
if (Schema.is(MySchema)(JSON.parse(raw))) { return true; }
return false;
