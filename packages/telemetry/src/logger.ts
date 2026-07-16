import { Effect, Logger, LogLevel } from "effect";

/**
Replace the default Effect `Logger` with one that writes to
Cloudflare Workers Logs via `console.*`.

Cloudflare automatically captures `console.log` / `console.warn` /
`console.error` / `console.debug` when `observability.enabled: true`
is set in `wrangler.jsonc`. By using `Effect.log*` (which emits
structured log records) and routing them through `Logger.pretty` —
which writes to `console.*` — we get both:

 - Structured, typed, `Effect.fn`-spanned logs in code.
 - Native delivery to Cloudflare Workers Logs in production.

Call this once per Worker entrypoint before any `Effect.runPromise`.
*/
export const installCloudflareLogger = () => {
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
