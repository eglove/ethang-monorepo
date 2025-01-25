import { parseFetchJson } from "@ethang/toolbelt/src/fetch/json.js";
import isError from "lodash/isError.js";
import { z } from "zod";

export const getLatestReact = async () => {
  const response = await globalThis.fetch(
    "https://registry.npmjs.org/react/latest",
  );
  const data = await parseFetchJson(
    response,
    z.object({ version: z.string() }),
  );

  if (isError(data)) {
    return;
  }

  return data;
};
