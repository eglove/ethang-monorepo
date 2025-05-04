import { cloudflare } from "@cloudflare/vite-plugin";
import TanStackRouterVite from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      autoCodeSplitting: true,
      target: "react",
    }),
    react(),
    cloudflare(),
  ],
});
