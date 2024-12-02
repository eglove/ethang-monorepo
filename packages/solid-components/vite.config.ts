import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  build: {
    target: "esnext",
  },
  plugins: [solidPlugin()],
  server: {
    port: 3000,
  },
});
