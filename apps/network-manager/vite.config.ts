import react from "@vitejs/plugin-react";
import isNil from "lodash/isNil.js";
import { defineConfig, type UserConfigExport } from "vite";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(() => {
  return {
    clearScreen: false,
    plugins: [react()],
    server: {
      hmr: isNil(host)
        ? false
        : {
            host,
            port: 1421,
            protocol: "ws",
          },
      host: host ?? false,
      port: 1420,
      strictPort: true,
      watch: {
        ignored: ["**/src-tauri/**"],
      },
    },
  } satisfies UserConfigExport;
});
