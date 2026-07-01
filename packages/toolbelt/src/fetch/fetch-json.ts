import type { Schema } from "effect";

import { parseFetchJson } from "./json.ts";

export const fetchJson = async <Z extends Schema.Schema.AnyNoContext>(
  input: Request | string | URL,
  schema: Z,
  init?: RequestInit
) => {
  const response = await globalThis.fetch(input, init);
  const json = await parseFetchJson(response, schema);

  if (Error.isError(json)) {
    return new Error(json.message);
  }

  return json;
};
