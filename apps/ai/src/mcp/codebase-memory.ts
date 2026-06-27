import { createMCPClient } from "@tanstack/ai-mcp";
import { Effect } from "effect";

import { CODEBASE_MEMORY_COMMAND } from "../environment.ts";

export const codebaseMemoryMcp = async () => {
  return Effect.runPromise(
    Effect.tryPromise(async () => {
      return createMCPClient({
        transport: {
          command: CODEBASE_MEMORY_COMMAND,
          type: "stdio"
        }
      });
    }).pipe(
      Effect.catchAll(() => {
        return Effect.succeed(null);
      })
    )
  );
};
