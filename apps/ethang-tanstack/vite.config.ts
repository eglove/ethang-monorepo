import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import endsWith from "lodash/endsWith.js";
import filter from "lodash/filter.js";
import reduce from "lodash/reduce.js";
import replace from "lodash/replace.js";
import { readdirSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

const routesDirectory = path.resolve(import.meta.dirname, "src/routes");

const entries = reduce(filter(readdirSync(routesDirectory), (file) => {
  return endsWith(file, ".tsx");
}), (accumulator: Record<string, string>, file) => {
  const name = replace(file, /\.(?<files>tsx)$/u, "");
  accumulator[name] = path.resolve(routesDirectory, file);
  return accumulator;
}, {});

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: entries,
    },
  },
  plugins: [TanStackRouterVite({}), react()],
});
