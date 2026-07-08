import { parseFetchJson } from "@ethang/toolbelt/fetch/json.ts";
import { Effect, Exit, Schema } from "effect";
import constant from "lodash/constant.js";

/**
Fetches the latest React version from npm registry.
Returns undefined if fetch fails or validation fails.
*/
export const getLatestReact = async () => {
  const response = await globalThis
    .fetch("https://registry.npmjs.org/react/latest")
    .catch(constant(null));

  if (!response) {
    return;
  }

  const result = await Effect.runPromiseExit(
    parseFetchJson(response, Schema.Struct({ version: Schema.String }))
  );

  if (Exit.isFailure(result)) {
    return;
  }

  return result.value;
};
