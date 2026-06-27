import { createMCPClient } from "@tanstack/ai-mcp";
import { Effect } from "effect";

import { WEBSTORM_MCP_URL } from "../environment.ts";

export const webstormMcp = async () => {
  return Effect.runPromise(
    Effect.tryPromise(async () => {
      return createMCPClient({
        transport: {
          type: "sse",
          url: WEBSTORM_MCP_URL
        }
      });
    }).pipe(
      Effect.catchAll(() => {
        return Effect.succeed(null);
      })
    )
  );
};
