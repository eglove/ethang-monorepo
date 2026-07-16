import { Effect, Logger, LogLevel } from "effect";

/**
Replace Effect's default `Logger` with `Logger.prettyLogger({ colors: false })`
so `Effect.log*` calls emit human-readable, color-free lines routed through
`console.*`.

`prettyLogger` writes to the host `console.*` methods, which means any
runtime that captures `console.log` / `console.warn` / `console.error` /
`console.debug` (Cloudflare Workers Logs, Node, browser devtools) will
pick the output up automatically.

Call this once per process entrypoint before any `Effect.runPromise` so
every later `Effect.log*` produces a pretty line instead of the default
structured log record.

General purpose: the function does not depend on Cloudflare-specific
APIs and is safe to call from any environment where Effect runs.
*/
export const installLogger = () => {
  const { defaultLogger } = Logger;
  const prettyLogger = Logger.prettyLogger({ colors: false });
  const layer = Logger.replace(defaultLogger, prettyLogger);

  // Discard the resulting layer after evaluating it; we just need the
  // side effect of replacing the global default logger.
  Effect.runSync(
    Effect.suspend(() => {
      return Effect.void;
    }).pipe(Effect.provide(layer))
  );
};

/**
Default minimum log level for production. Lower in development.
*/
export const defaultLogLevel = () => {
  const environment = (
    globalThis as { process?: { env?: { ENVIRONMENT?: string } } }
  ).process?.env?.ENVIRONMENT;
  return "production" === environment ? LogLevel.Info : LogLevel.Debug;
};
