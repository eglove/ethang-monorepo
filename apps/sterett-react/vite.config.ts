import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
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
});
