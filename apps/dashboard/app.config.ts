import { defineConfig } from "@solidjs/start/config";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "node:path";

export default defineConfig({
  server: {
    preset: "cloudflare-pages",
    rollupConfig: {
      external: ["node:async_hooks"],
    },
  },
  vite: {
    plugins: [TanStackRouterVite({ target: "solid" })],
    resolve: {
      alias: {
        "~": path.resolve(import.meta.dirname, "./src"),
      },
    },
  },
});
