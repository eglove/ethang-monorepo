import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.tsx"],
  format: ["esm"],
  loader: {
    ".tsx": "tsx"
  },
  outDir: "dist",
  platform: "node",
  sourcemap: true,
  target: "node24"
});
