import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import { icons } from "./icons.ts";

export default defineConfig({
  plugins: [
    TanStackRouterVite({}),
    react(),
    VitePWA({
      manifest: {
        background_color: "#000000",
        display: "browser",
        icons,
        name: "EthanG",
        scope: "https://ethang.dev/",
        short_name: "EthanG",
        start_url: "https://ethang.dev/",
        theme_color: "#000000",
      },
      registerType: "autoUpdate",
      workbox: {
        runtimeCaching: [
          {
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "js-css-cache",
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 30,
                maxEntries: 100,
              },
            },
            urlPattern: /\.(?:js|css)$/u,
          },
          {
            handler: "NetworkFirst",
            options: {
              cacheName: "html-cache",
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 7,
                maxEntries: 50,
              },
            },
            urlPattern: /\.html$/u,
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
