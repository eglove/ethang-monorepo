import { Effect } from "effect";

/**
Re-export of `Effect.fn` so workers and packages can import it from a
single observability entry point. `Effect.fn` creates a traced span
around the function body automatically, including the function name
in the trace, structured annotations, and a precise stack trace on
failure.

Example:
```ts
import { Effect } from "effect";
import { fn } from "@ethang/telemetry/spans.ts";

export const fetchFeed = fn("fetchFeed")(function* (url: string) {
  const response = yield* Effect.tryPromise(() => fetch(url));
  return yield* Effect.tryPromise(() => response.text());
});
```
*/
export const { fn } = Effect;
