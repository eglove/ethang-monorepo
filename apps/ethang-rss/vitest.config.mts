// @ts-expect-error ignore
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.jsonc" }
      }
    }
  }
});
