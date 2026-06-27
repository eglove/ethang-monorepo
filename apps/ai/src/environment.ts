import { Schema } from "effect";
import constant from "lodash/constant.js";

// ── Schema definitions ──────────────────────────────────────

const _OpenRouterApiKey = Schema.NonEmptyTrimmedString.pipe(
  Schema.annotations({ identifier: "OpenRouterApiKey" })
);

// ── Combined env schema ─────────────────────────────────────

const EnvironmentSchema = Schema.Struct({
  CODEBASE_MEMORY_COMMAND: Schema.withDefaults(Schema.optional(Schema.String), {
    constructor: constant("codebase-memory-mcp"),
    decoding: constant("codebase-memory-mcp")
  }),
  OPENROUTER_API_KEY: _OpenRouterApiKey,
  OPENROUTER_BASE_URL: Schema.withDefaults(Schema.optional(Schema.String), {
    constructor: constant("https://openrouter.ai/api/v1"),
    decoding: constant("https://openrouter.ai/api/v1")
  }),
  OPENROUTER_MODEL: Schema.withDefaults(Schema.optional(Schema.String), {
    constructor: constant("openrouter/owl-alpha"),
    decoding: constant("openrouter/owl-alpha")
  }),
  PLAN_OUTPUT_PATH: Schema.withDefaults(Schema.optional(Schema.String), {
    constructor: constant("plan.md"),
    decoding: constant("plan.md")
  }),
  WEBSTORM_MCP_URL: Schema.withDefaults(Schema.optional(Schema.String), {
    constructor: constant("http://127.0.0.1:64506/sse"),
    decoding: constant("http://127.0.0.1:64506/sse")
  })
});

type Environment = Schema.Schema.Type<typeof EnvironmentSchema>;

// ── Parse & validate at module load ─────────────────────────

const environment: Environment = Schema.decodeUnknownSync(EnvironmentSchema)(
  process.env
);

// ── Typed exports ───────────────────────────────────────────

export const { OPENROUTER_API_KEY } = environment;
export const { OPENROUTER_BASE_URL } = environment;
export const { OPENROUTER_MODEL } = environment;
export const { CODEBASE_MEMORY_COMMAND } = environment;
export const { WEBSTORM_MCP_URL } = environment;
export const { PLAN_OUTPUT_PATH } = environment;
