import { defineConfig } from "@solidjs/start/config";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  vite: {
    plugins: [TanStackRouterVite({ target: "solid" })]
  },

  server: {
    preset: "cloudflare-pages",

    rollupConfig: {
      external: ["node:async_hooks"]
    }
  }
});