import { ZodError, type ZodObject } from "zod";

import { parseFetchJson } from "./json.ts";

export const fetchJson = async <Z extends ZodObject>(
  input: Request | string | URL,
  schema: Z,
  init?: RequestInit,
) => {
  const response = await globalThis.fetch(input, init);
  const json = await parseFetchJson(response, schema);

  if (json instanceof ZodError) {
    return new Error(json.message);
  }

  return json;
};
