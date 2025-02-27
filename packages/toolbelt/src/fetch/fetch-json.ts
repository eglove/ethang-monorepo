import { ZodError } from "zod";

import type { ZodValidator } from "../types/zod-validator.js";

import { parseFetchJson } from "./json.ts";

export const fetchJson = async <Z extends ZodValidator<Z>>(
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
