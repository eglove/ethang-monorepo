import { parseFetchJson } from "@ethang/toolbelt/fetch/json.js";
import { Schema } from "effect";
import isError from "lodash/isError.js";

export const getLatestReact = async () => {
  const response = await globalThis.fetch(
    "https://registry.npmjs.org/react/latest"
  );
  const data = await parseFetchJson(
    response,
    Schema.Struct({ version: Schema.String })
  );

  if (isError(data)) {
    return;
  }

  return data;
};
