import { Effect, Exit, Schema } from "effect";
import constant from "lodash/constant.js";

/**
Fetches the latest React version from npm registry.
Returns null if fetch fails or validation fails.
*/
export const getLatestReact = async () => {
  const response = await globalThis
    .fetch("https://registry.npmjs.org/react/latest")
    .catch(constant(null));

  if (!response) {
    return null;
  }

  const result = await Effect.runPromiseExit(
    Schema.decodeUnknown(Schema.Struct({ version: Schema.String }))(
      await response.json()
    )
  );

  if (Exit.isFailure(result)) {
    return null;
  }

  return result.value;
};
