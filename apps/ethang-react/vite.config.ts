import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackRouter({
      autoCodeSplitting: true,
      routeFileIgnorePattern: String.raw`.*\.test\..*`,
      target: "react"
    }),
    react(),
    cloudflare()
  ]
});
